import { useState } from 'react';
import AppLayout from 'layout/app-layout';
import NextLink from 'next/link';
import {
  Box,
  Text,
  Button,
  Link,
  Flex,
  Center,
  ButtonGroup,
  Divider,
  Stack,
  InputGroup,
  InputRightAddon,
  Input,
  Icon,
} from '@chakra-ui/react';
import useSWR from 'swr';
import { Spinner } from '@chakra-ui/react';
import { Card, CardHeader, CardBody, CardFooter } from '@chakra-ui/react';
import { getJobs, deleteJobById, searchJobs } from 'apiSdk/jobs';
import { JobInterface } from 'interfaces/job';
import { Error } from 'components/error';
import {
  AccessOperationEnum,
  AccessServiceEnum,
  useAuthorizationApi,
  requireNextAuth,
  withAuthorization,
  useSession,
} from '@roq/nextjs';
import { useRouter } from 'next/router';
import { FiTrash2 } from 'react-icons/fi';
import { compose } from 'lib/compose';
import { ApplicationInterface } from 'interfaces/application';
import { getApplications } from 'apiSdk/applications';

function JobListPage() {
  const { hasAccess } = useAuthorizationApi();
  const [query, setQuery] = useState('');

  const {
    data: applications,
    error: applicationError,
    isLoading: applicationLoading,
    mutate: applicationMutate,
  } = useSWR<ApplicationInterface[]>(
    () => '/applications',
    () =>
      getApplications({
        relations: ['job', 'user'],
      }),
  );

  const { data, error, isLoading, mutate } = useSWR<JobInterface[]>(
    () => '/jobs',
    () =>
      getJobs({
        relations: ['company', 'application.count'],
      }),
  );

  const searchFromBE = async (query: string) =>
    await searchJobs({ q: query, relations: ['company', 'application.count'] });

  const { data: filtered, mutate: search } = useSWR<JobInterface[]>([query], searchFromBE);

  const router = useRouter();
  const [deleteError, setDeleteError] = useState(null);

  const session = useSession();
  const currentRole = session.session.user.roles[0];
  const handleDelete = async (id: string) => {
    setDeleteError(null);
    try {
      await deleteJobById(id);
      await mutate();
    } catch (error) {
      setDeleteError(error);
    }
  };

  const handleView = (id: string) => {
    if (hasAccess('job', AccessOperationEnum.READ, AccessServiceEnum.PROJECT)) {
      router.push(`/jobs/view/${id}`);
    }
  };

  const handleSearch = () => {};

  const formatDateTime = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    };
    return new Date(dateString).toLocaleString(undefined, options);
  };
  return (
    <AppLayout>
      <Box bg="white" p={4} rounded="md" shadow="md">
        <Flex justifyContent="space-between" mb={4}>
          <Text as="h1" fontSize="2xl" fontWeight="bold">
            {currentRole === 'job-applicant' ? 'Recommended Jobs for You' : 'My Job Listing'}
          </Text>
          {hasAccess('job', AccessOperationEnum.CREATE, AccessServiceEnum.PROJECT) && (
            <NextLink href={`/jobs/create`} passHref legacyBehavior>
              <Button onClick={(e) => e.stopPropagation()} colorScheme="primary" as="a">
                Post New Job
              </Button>
            </NextLink>
          )}
        </Flex>
        {error && (
          <Box mb={4}>
            <Error error={error} />
          </Box>
        )}
        {deleteError && (
          <Box mb={4}>
            <Error error={deleteError} />{' '}
          </Box>
        )}
        {isLoading ? (
          <Center>
            <Spinner />
          </Center>
        ) : (
          <>
            <InputGroup>
              <Input placeholder="Search..." value={query} onChange={(e) => setQuery(e.target.value)} />
              <InputRightAddon
                bgColor="primary.500"
                // eslint-disable-next-line react/no-children-prop
                children={
                  <Button colorScheme="primary" size="sm" onClick={() => mutate(searchFromBE(query), false)}>
                    Search
                  </Button>
                }
              />
            </InputGroup>

            {data?.map((record) => {
              const submitted = applications?.findIndex((app) => app?.job_id === record?.id) !== -1;
              return (
                <Card mt={4} onClick={() => handleView(record.id)} key={record.id} variant={'outline'} cursor="pointer">
                  <CardHeader>
                    <Text fontSize="xl" fontWeight="bold">
                      {record.title} - {record.company?.name}
                    </Text>
                  </CardHeader>
                  <CardBody py={2}>
                    <Text noOfLines={3}>{record.description}</Text>
                  </CardBody>
                  <CardBody pb={2}>
                    <Text fontSize="sm" color="gray.600">
                      Posted on {formatDateTime(record.created_at)}
                    </Text>
                  </CardBody>
                  <Divider color={'gray.200'} />
                  <CardFooter>
                    <ButtonGroup spacing="2" justifyContent="space-between" display="flex" width="100%">
                      <Stack direction="row">
                        {hasAccess('job', AccessOperationEnum.UPDATE, AccessServiceEnum.PROJECT) && (
                          <NextLink href={`/jobs/view/${record.id}`} passHref>
                            <Button variant="solid" colorScheme="primary">
                              View Applicants ({record?._count?.application ?? 0})
                            </Button>
                          </NextLink>
                        )}

                        {hasAccess('job', AccessOperationEnum.READ, AccessServiceEnum.PROJECT) &&
                          currentRole === 'job-applicant' && (
                            <Link href={`/applications/create/?job_id=${record.id}`}>
                              <Button isDisabled={submitted} variant="solid" colorScheme="primary">
                                {submitted ? 'Submitted' : 'Apply Now'}
                              </Button>
                            </Link>
                          )}
                      </Stack>
                      {hasAccess('job', AccessOperationEnum.DELETE, AccessServiceEnum.PROJECT) && (
                        <Button
                          variant="outline"
                          colorScheme="red"
                          leftIcon={<Icon as={FiTrash2} />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(record.id);
                          }}
                        >
                          Delete
                        </Button>
                      )}
                    </ButtonGroup>
                  </CardFooter>
                </Card>
              );
            })}
          </>
        )}
      </Box>
    </AppLayout>
  );
}

export default compose(
  requireNextAuth({
    redirectTo: '/',
  }),
  withAuthorization({
    service: AccessServiceEnum.PROJECT,
    entity: 'job',
    operation: AccessOperationEnum.READ,
  }),
)(JobListPage);
