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
  HStack,
  Icon,
  Container,
} from '@chakra-ui/react';
import { FiTrash, FiEdit2, FiEdit3, FiFile, FiDownload } from 'react-icons/fi';
import { getJobById } from 'apiSdk/jobs';
import { Error } from 'components/error';
import { JobInterface } from 'interfaces/job';
import useSWR from 'swr';
import { useRouter } from 'next/router';
import { compose } from 'lib/compose';
import {
  AccessOperationEnum,
  AccessServiceEnum,
  ChatWindow,
  requireNextAuth,
  useAuthorizationApi,
  useSession,
  withAuthorization,
} from '@roq/nextjs';
import { getApplications, updateApplicationById } from 'apiSdk/applications';
import { getUsers } from 'apiSdk/users';
import { UserInterface } from 'interfaces/user';
import { ApplicationInterface } from 'interfaces/application';

function JobViewPage() {
  const { hasAccess } = useAuthorizationApi();
  const router = useRouter();
  const id = router.query.id as string;
  const { data, error, isLoading, mutate } = useSWR<JobInterface>(
    () => (id ? `/jobs/${id}` : null),
    () =>
      getJobById(id, {
        relations: ['company', 'application'],
      }),
  );

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
  const submitted = applications?.findIndex((app) => app?.job_id === id) !== -1;

  const { data: userData } = useSWR<UserInterface[]>(
    () => '/users',
    () => getUsers(),
  );

  let userNames: any = {};
  const applicationDataWithUserNames = data?.application.map((app) => {
    // Find the corresponding user from the userData array using user_id
    const user = userData?.find((user) => user.id === app?.user_id);

    // Return an object containing application details along with first and last names

    userNames[app.user_id] = {
      userFirstName: user?.firstName || 'Unknown',
      userLastName: user?.lastName || 'User',
      userEmail: user?.email || 'Email',
    };
  });
  const session = useSession();
  const currentRole = session.session.user.roles[0];

  const handleDownloadAttachment = (attachmentUrl: string) => {
    const link = document.createElement('a');
    link.href = attachmentUrl;
    link.target = '_blank';
    link.download = 'attachment.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const applicationHandleDelete = async (id: string, rest: ApplicationInterface) => {
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
      await updateApplicationById(application.id, { ...application, status: 'Hired' });
      await mutate();
    } catch (error) {
      setDeleteError(error);
    }
  };

  const [deleteError, setDeleteError] = useState(null);
  const [createError, setCreateError] = useState(null);

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
                      <Card key={record.id} variant="outline" borderWidth="1px" borderRadius="md" p={4}>
                        <Flex alignItems="center">
                          <Avatar src={record.user?.profileImage} mr={4} />
                          <Box flex="1">
                            <Text fontSize="lg" fontWeight="bold">
                              {userNames[record.user_id].userFirstName} {userNames[record.user_id].userLastName}
                            </Text>
                            <Text as="span" color={'gray.500'} lineHeight="1">
                              @{userNames[record.user_id].userEmail}
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
                        {record.attachement && (
                          <Flex maxW="5xl" ml={6}>
                            <Box bg="bg-surface" borderRadius="lg" p={{ base: '4', md: '6' }}>
                              <Stack spacing="5">
                                <Stack spacing="1">
                                  <Text fontSize="lg" fontWeight="medium">
                                    Attachement
                                  </Text>
                                  <Text fontSize="sm" color="muted">
                                    This is the attachment of the applicant.
                                  </Text>
                                </Stack>
                                <Box
                                  borderWidth={{ base: '0', md: '1px' }}
                                  p={{ base: '0', md: '2' }}
                                  borderRadius="lg"
                                >
                                  <Stack justify="space-between" direction={{ base: 'column', md: 'row' }} spacing="5">
                                    <HStack spacing="3" alignItems="center">
                                      <Icon as={FiFile} boxSize="5" />
                                      <Box fontSize="sm">
                                        <Text color="emphasized" fontWeight="medium">
                                          {record.attachement}
                                        </Text>
                                      </Box>
                                    </HStack>
                                    <Stack spacing="3" direction={{ base: 'column-reverse', md: 'row' }}>
                                      <Button
                                        variant="secondary"
                                        onClick={() => handleDownloadAttachment(record.attachement)}
                                      >
                                        <Icon as={FiDownload} mr="2" />
                                        Download
                                      </Button>
                                      <Button variant="primary">
                                        <Icon as={FiEdit3} mr="2" />
                                        View
                                      </Button>
                                    </Stack>
                                  </Stack>
                                </Box>
                              </Stack>
                            </Box>
                          </Flex>
                        )}
                        {record?.roqConversationId && (
                          <Box mt={12}>
                            <ChatWindow conversationId={record.roqConversationId} />
                          </Box>
                        )}

                        <Divider color="gray.200" mt={4} mb={2} />
                        <CardFooter>
                          <ButtonGroup spacing="3">
                            {hasAccess('application', AccessOperationEnum.UPDATE, AccessServiceEnum.PROJECT) &&
                              record.status !== 'Rejected' && (
                                <Button
                                  isDisabled={record.status === 'Hired'}
                                  colorScheme="primary"
                                  // leftIcon={<Icon as={FiEdit2} />}
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
                                  onClick={() => applicationHandleDelete(record.id, record)}
                                  variant="outline"
                                  colorScheme="red"
                                >
                                  {record.status === 'Rejected' ? 'Rejected' : 'Reject'}
                                </Button>
                              )}
                          </ButtonGroup>
                        </CardFooter>
                      </Card>
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
