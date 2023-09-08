import { KeyboardEvent, useState } from 'react';
import AppLayout from 'layout/app-layout';
import NextLink from 'next/link';
import { Box, Text, Button, Flex, Center, InputGroup, InputRightAddon, Input } from '@chakra-ui/react';
import useSWR from 'swr';
import { Spinner } from '@chakra-ui/react';
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
import { compose } from 'lib/compose';
import { ApplicationInterface } from 'interfaces/application';
import { getApplications } from 'apiSdk/applications';
import JobCard from 'components/job/JobCard';

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
  const handleKeyPress = async (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      try {
        const searchData = await searchFromBE(query);
        mutate(searchData, false);
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleSearch = async () => {
    try {
      const searchData = await searchFromBE(query);
      search(searchData, false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <AppLayout>
      <Box bg="white" p={4} rounded="md" shadow="md">
        <Flex justifyContent="space-between" mb={4}>
          <Text as="h1" fontSize="2xl" fontWeight="bold">
            {currentRole === 'job-applicant' ? 'Recommended Jobs for You' : 'My Job Listing'}
          </Text>
          {hasAccess('job', AccessOperationEnum.CREATE, AccessServiceEnum.PROJECT) && (
            <NextLink href={`/jobs/create`}>
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
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch();
              }}
            >
              <InputGroup>
                <Input
                  placeholder="Search..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <InputRightAddon bgColor="primary.500">
                  <Button colorScheme="primary" size="sm" onClick={() => mutate(searchFromBE(query), false)}>
                    Search
                  </Button>
                </InputRightAddon>
              </InputGroup>
            </form>
            {data?.map((record) => {
              return (
                <JobCard
                  key={record.id}
                  record={record}
                  applications={applications}
                  currentRole={currentRole}
                  handleView={handleView}
                  handleDelete={handleDelete}
                />
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
