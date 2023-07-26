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
} from '@chakra-ui/react';
import { FiTrash, FiEdit3, FiFile, FiDownload } from 'react-icons/fi';
import { Error } from 'components/error';
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
import { getApplicationById, updateApplicationById } from 'apiSdk/applications';
import { getUsers } from 'apiSdk/users';
import { UserInterface } from 'interfaces/user';
import { ApplicationInterface } from 'interfaces/application';

function JobDetailPage() {
  const { hasAccess } = useAuthorizationApi();
  const router = useRouter();
  const session = useSession();
  const currentRole = session.session.user.roles[0];
  const [deleteError, setDeleteError] = useState(null);
  const [createError, setCreateError] = useState(null);
  const id = router.query.id as string;

  const { data, error, isLoading, mutate } = useSWR<ApplicationInterface>(
    () => (id ? `/applications/${id}` : null),
    () =>
      getApplicationById(id, {
        relations: ['job', 'user'],
      }),
  );
  console.log({ data });
  const {
    data: userData,
    error: userError,
    isLoading: userLoading,
  } = useSWR<UserInterface[]>(
    () => '/users',
    () => getUsers(),
  );

  if (isLoading) {
    return <Spinner />;
  }

  const handleDownloadAttachment = (attachmentUrl: string) => {
    const link = document.createElement('a');
    link.href = attachmentUrl;
    link.target = '_blank';
    link.download = 'attachment.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
  function AttachementFileName(input: string) {
    const slash = input.split('/')
    return slash[slash.length - 1]
  }

  return (
    <AppLayout>
      <Card bg="white" p={8} rounded="md" shadow="md">
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
              <Divider />
              {hasAccess('application', AccessOperationEnum.READ, AccessServiceEnum.PROJECT) &&
                currentRole === 'job-poster' && (
                  <Stack spacing={4}>
                    <Flex>
                      <Text fontSize="lg" fontWeight="bold">
                        Application Detail for {data.job.title}
                      </Text>
                    </Flex>
                    <Box>
                      <Text fontSize="md" fontWeight="bold">
                        Job Description
                      </Text>
                      <Text fontSize="md">{data?.job?.description}</Text>
                    </Box>

                    <Card key={data.id} variant="outline" borderWidth="1px" borderRadius="md" p={4}>
                      <Flex alignItems="center">
                        <Avatar src={data.user?.profileImage} mr={4} />
                        <Box flex="1">
                          <Text fontSize="lg" fontWeight="bold">
                            {data.user.firstName ?? 'Unknown'} {data.user.lastName ?? 'User'}
                          </Text>
                          <Text as="span" color={'gray.500'} lineHeight="1">
                            {data.user.email ?? 'Unknown'}
                          </Text>
                        </Box>
                      </Flex>
                      <Flex>
                        <Text color="gray.600" mt={4} ml={12} fontWeight="medium">
                          Cover Letter:
                        </Text>
                        <Text color="gray.600" fontWeight="normal" mt={4} ml={2} noOfLines={2}>
                          {data.coverLetter}
                        </Text>
                      </Flex>

                      {data.attachement && (
                        <Flex maxW="5xl" ml={6}>
                          <Box bg="bg-surface" borderRadius="lg" p={{ base: '4', md: '6' }}>
                            <Stack spacing="5">
                              <Stack spacing="1">
                                <Text fontSize="lg" fontWeight="medium">
                                  Attachements
                                </Text>
                              </Stack>
                              <Box borderWidth={{ base: '0', md: '1px' }} p={{ base: '0', md: '2' }} borderRadius="lg">
                                <Stack
                                  justify="space-between"
                                  direction={{
                                    base: 'column',
                                    md: 'row',
                                  }}
                                  spacing="5"
                                >
                                  <HStack spacing="3" alignItems="center">
                                    <Icon as={FiFile} boxSize="5" />
                                    <Box fontSize="sm">
                                      <Text color="emphasized" fontWeight="medium">
                                        {AttachementFileName(data.attachement)}
                                      </Text>
                                    </Box>
                                  </HStack>
                                  <Stack
                                    spacing="3"
                                    direction={{
                                      base: 'column-reverse',
                                      md: 'row',
                                    }}
                                  >
                                    <Button
                                      variant="secondary"
                                      onClick={() => handleDownloadAttachment(data.attachement)}
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
                      {data?.roqConversationId && (
                        <Box mt={12}>
                          <ChatWindow conversationId={data.roqConversationId} />
                        </Box>
                      )}

                      <Divider color="gray.200" mt={4} mb={2} />
                      <CardFooter>
                        <ButtonGroup spacing="3">
                          {hasAccess('application', AccessOperationEnum.UPDATE, AccessServiceEnum.PROJECT) &&
                            data.status !== 'Rejected' && (
                              <Button
                                isDisabled={data.status === 'Hired'}
                                colorScheme="primary"
                                onClick={() => handleHire(data)}
                              >
                                {data.status === 'Hired' ? 'Hired' : 'Hire'}
                              </Button>
                            )}
                          {hasAccess('application', AccessOperationEnum.DELETE, AccessServiceEnum.PROJECT) &&
                            data.status !== 'Hired' && (
                              <Button
                                isDisabled={data.status === 'Rejected'}
                                leftIcon={<Icon as={FiTrash} />}
                                onClick={() => applicationHandleReject(data.id, data)}
                                variant="outline"
                                colorScheme="red"
                              >
                                {data.status === 'Rejected' ? 'Rejected' : 'Reject'}
                              </Button>
                            )}
                        </ButtonGroup>
                      </CardFooter>
                    </Card>
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
)(JobDetailPage);
