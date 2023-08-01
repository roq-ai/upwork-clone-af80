import { useState } from 'react';
import AppLayout from 'layout/app-layout';
import NextLink from 'next/link';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Box,
  Text,
  Button,
  Link,
  IconButton,
  Flex,
  Center,
  Divider,
  Badge,
} from '@chakra-ui/react';
import useSWR from 'swr';
import { Spinner } from '@chakra-ui/react';
import { Card, CardHeader, CardBody, CardFooter } from '@chakra-ui/react';
import { getApplications, deleteApplicationById, updateApplicationById } from 'apiSdk/applications';
import { ApplicationInterface } from 'interfaces/application';
import { Error } from 'components/error';
import {
  AccessOperationEnum,
  AccessServiceEnum,
  useAuthorizationApi,
  requireNextAuth,
  withAuthorization,
  useSession,
  ChatWindow,
} from '@roq/nextjs';
import { useRouter } from 'next/router';
import { compose } from 'lib/compose';
import { getUsers } from 'apiSdk/users';
import { UserInterface } from 'interfaces/user';

function ApplicationListPage() {
  const { hasAccess } = useAuthorizationApi();
  const router = useRouter();
  const id = router.query.id as string;
  const { data, error, isLoading, mutate } = useSWR<ApplicationInterface[]>(
    () => '/applications',
    () =>
      getApplications({
        relations: ['job', 'user'],
      }),
  );
  console.log('chat application', { data });

  const [deleteError, setDeleteError] = useState(null);

  // const handleDelete = async (id: string) => {
  //   setDeleteError(null);
  //   try {
  //     await deleteApplicationById(id);
  //     await mutate();
  //   } catch (error) {
  //     setDeleteError(error);
  //   }
  // };

  const [expandedApplication, setExpandedApplication] = useState<string | null>(null);

  const handleToggleDetails = (applicationId: string) => {
    setExpandedApplication((prevId) => (prevId === applicationId ? null : applicationId));
  };

  type Status = 'Hired' | 'Rejected' | 'Submitted';

  const getButtonColor = (status: Status) => {
    if (status === 'Hired') {
      return 'green';
    } else if (status === 'Rejected') {
      return 'red';
    } else {
      return 'yellow';
    }
  };
  return (
    <AppLayout>
      <Box bg="white" p={4} rounded="md" shadow="md">
        <Flex justifyContent="space-between" alignItems="center" mb={4}>
          <Text as="h1" fontSize="2xl" fontWeight="bold">
            My Applications
          </Text>
        </Flex>
        {error && (
          <Box mb={4}>
            <Error error={error} />
          </Box>
        )}
        {deleteError && (
          <Box mb={4}>
            <Error error={deleteError} />
          </Box>
        )}
        {isLoading ? (
          <Center>
            <Spinner />
          </Center>
        ) : (
          <Box>
            {data?.map((record) => (
              <Link href={`/applications/details/${record.id}`} key={record.id}>
                <Box mt={4}>
                  <Card p={4} border="1px solid" borderColor="gray.200" borderRadius="md" boxShadow="lg">
                    <CardHeader>
                      <Text fontSize="xl" fontWeight="bold">
                        {record.job?.title}
                      </Text>
                    </CardHeader>
                    <CardBody>
                      <Text fontSize="md" fontWeight="medium">
                        Cover Letter
                      </Text>
                      <Text py={2} fontSize="sm" color="gray.600" noOfLines={2}>
                        {record.coverLetter}
                      </Text>
                    </CardBody>
                    {expandedApplication === record.id && (
                      <>
                        <CardBody>
                          <Text fontSize="md" fontWeight="medium">
                            Job Description
                          </Text>
                          <Text py={2} fontSize="sm" color="gray.600">
                            {record.job.description}
                          </Text>
                        </CardBody>

                        <Divider color="gray.200" mt={2} />
                        <CardFooter mt={2}>
                          <Badge colorScheme={getButtonColor(record.status as Status)} px={2} py={1} borderRadius="md">
                            {record.status}
                          </Badge>{' '}
                        </CardFooter>
                        {record?.roqConversationId && (
                          <Box mt={12}>
                            <ChatWindow conversationId={record.roqConversationId} />
                          </Box>
                        )}
                      </>
                    )}
                    <Divider color="gray.100" mb={3} />
                    {/* <Button onClick={() => handleToggleDetails(record.id)} width={200}>
                      {expandedApplication === record.id ? 'Hide Detail' : 'Show Detail'}
                    </Button> */}
                  </Card>
                </Box>
              </Link>
            ))}
          </Box>
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
    entity: 'application',
    operation: AccessOperationEnum.READ,
  }),
)(ApplicationListPage);
