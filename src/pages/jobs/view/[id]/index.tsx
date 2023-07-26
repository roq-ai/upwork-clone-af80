import AppLayout from 'layout/app-layout';
import { useState } from 'react';
import {
  Text,
  Box,
  Spinner,
  Card,
  Button,
  Flex,
  Center,
  Stack,
  Avatar,
  Divider,
  ButtonGroup,
  CardFooter,
  Icon,
} from '@chakra-ui/react';
import { FiTrash } from 'react-icons/fi';
import { getJobById } from 'apiSdk/jobs';
import { Error } from 'components/error';
import { JobInterface } from 'interfaces/job';
import useSWR from 'swr';
import { useRouter } from 'next/router';
import { compose } from 'lib/compose';
import {
  AccessOperationEnum,
  AccessServiceEnum,
  requireNextAuth,
  useAuthorizationApi,
  useSession,
  withAuthorization,
} from '@roq/nextjs';
import { updateApplicationById } from 'apiSdk/applications';
import { getUsers } from 'apiSdk/users';
import { UserInterface } from 'interfaces/user';
import { ApplicationInterface } from 'interfaces/application';
import Link from 'next/link';

function JobViewPage() {
  const { hasAccess } = useAuthorizationApi();
  const session = useSession();
  const currentRole = session.session.user.roles[0];
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const id = router.query.id as string;
  const { data, error, isLoading, mutate } = useSWR<JobInterface>(
    () => (id ? `/jobs/${id}` : null),
    () =>
      getJobById(id, {
        relations: ['company', 'application'],
      }),
  );

  const {
    data: userData,
    error: userError,
    isLoading: userLoading,
  } = useSWR<UserInterface[]>(
    () => '/users',
    () => getUsers(),
  );

  let userNames: any = {};
  data?.application.map((app) => {
    // console.log({ app });
    const applicant = userData?.find((user) => user.id === app?.user_id);
    userNames[app.user_id] = {
      // profileImage:applicant?.
      userFirstName: applicant?.firstName,
      userLastName: applicant?.lastName,
      userEmail: applicant?.email,
    };
  });

  const applicationHandleReject = async (id: string, rest: ApplicationInterface) => {
    setDeleteError(null);
    try {
      await updateApplicationById(id, { ...rest, status: 'Rejected' });
      await mutate();
    } catch (error) {
      setDeleteError(error);
    }
  };

  const handleHire = async (application: ApplicationInterface) => {
    setDeleteError(null);

    try {
      await updateApplicationById(application.id, {
        ...application,
        status: 'Hired',
      });
      await mutate();
    } catch (error) {
      setDeleteError(error);
    }
  };

  return (
    <AppLayout>
      <Card bg="white" p={8} rounded="md" shadow="md">
        <Text as="h2" fontSize="xl" fontWeight="bold" mb={2}>
          {data?.title}
        </Text>
        <Text fontSize="md" fontWeight="medium" mb={4}>
          {data?.company.name}
        </Text>
        {error && (
          <Box mb={4}>
            <Error error={error} />
          </Box>
        )}
        {isLoading ? (
          <Center>
            <Spinner />
          </Center>
        ) : (
          <>
            <Stack direction="column" spacing={4}>
              <Box>
                <Text fontSize="md" fontWeight="bold">
                  Job Description
                </Text>
                <Text fontSize="md">{data?.description}</Text>
              </Box>

              <Divider />
              {hasAccess('application', AccessOperationEnum.READ, AccessServiceEnum.PROJECT) &&
                currentRole === 'job-poster' && (
                  <Stack spacing={4}>
                    <Flex>
                      <Text fontSize="lg" fontWeight="bold">
                        Applications
                      </Text>
                    </Flex>

                    {data?.application?.map((record) => (
                      <Link href={`/jobs/details/${record.id}`} key={record.id}>
                        <Card variant="outline" borderWidth="1px" borderRadius="md" p={4}>
                          <Flex alignItems="center">
                            <Avatar src={record.user?.profileImage} mr={4} />
                            <Box flex="1">
                              <Text fontSize="lg" fontWeight="bold">
                                {userNames[record.user_id].userFirstName} {userNames[record.user_id].userLastName}
                              </Text>
                              <Text as="span" color={'gray.500'} lineHeight="1">
                                {userNames[record.user_id].userEmail}
                              </Text>
                            </Box>
                          </Flex>
                          <Flex>
                            <Text color="gray.600" mt={4} ml={12} fontWeight="medium">
                              Cover Letter:
                            </Text>
                            <Text color="gray.600" fontWeight="normal" mt={4} ml={2} noOfLines={2}>
                              {record.coverLetter}
                            </Text>
                          </Flex>

                          <Divider color="gray.200" mt={4} mb={2} />
                          <CardFooter>
                            <ButtonGroup spacing="3">
                              {hasAccess('application', AccessOperationEnum.UPDATE, AccessServiceEnum.PROJECT) &&
                                record.status !== 'Rejected' && (
                                  <Button
                                    isDisabled={record.status === 'Hired'}
                                    colorScheme="primary"
                                    onClick={() => handleHire(record)}
                                  >
                                    {record.status === 'Hired' ? 'Hired' : 'Hire'}
                                  </Button>
                                )}
                              {hasAccess('application', AccessOperationEnum.DELETE, AccessServiceEnum.PROJECT) &&
                                record.status !== 'Hired' && (
                                  <Button
                                    isDisabled={record.status === 'Rejected'}
                                    leftIcon={<Icon as={FiTrash} />}
                                    onClick={() => applicationHandleReject(record.id, record)}
                                    variant="outline"
                                    colorScheme="red"
                                  >
                                    {record.status === 'Rejected' ? 'Rejected' : 'Reject'}
                                  </Button>
                                )}
                            </ButtonGroup>
                          </CardFooter>
                        </Card>
                      </Link>
                    ))}
                  </Stack>
                )}
            </Stack>
          </>
        )}
      </Card>
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
)(JobViewPage);
