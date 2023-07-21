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
import { getApplications, deleteApplicationById, hire, updateApplicationById } from 'apiSdk/applications';
import { ApplicationInterface } from 'interfaces/application';
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
import { getUsers } from 'apiSdk/users';
import { UserInterface } from 'interfaces/user';

function ApplicationListPage() {
  const { hasAccess } = useAuthorizationApi();
  const { data, error, isLoading, mutate } = useSWR<ApplicationInterface[]>(
    () => '/applications',
    () =>
      getApplications({
        relations: ['job', 'user'],
      }),
  );

  const router = useRouter();
  const [deleteError, setDeleteError] = useState(null);

  const handleDelete = async (id: string) => {
    setDeleteError(null);
    try {
      await deleteApplicationById(id);
      await mutate();
    } catch (error) {
      setDeleteError(error);
    }
  };

  const { data: user } = useSWR<UserInterface[]>(
    () => '/users',
    () =>
      getUsers({
        email: session.user.email,
      }),
  );

  const currentSession = useSession();
  const currentRole = currentSession.session.user.roles[0];

  const handleHire = async (application: ApplicationInterface) => {
    setDeleteError(null);
    const userId = user?.[0].id;
    try {
      await hire({
        jobTitle: application.job.title,
        userId: application.job.company_id,
        applicantId: application.user_id,
      });
      await updateApplicationById(application.id, { ...application, status: 'Hired' });
      await mutate();
    } catch (error) {
      setDeleteError(error);
    }
  };
  type Status = 'Hired' | 'Rejected' | 'Submitted';
  const { session } = useSession();

  const handleView = (id: string) => {
    if (hasAccess('application', AccessOperationEnum.READ, AccessServiceEnum.PROJECT)) {
      router.push(`/applications/view/${id}`);
    }
  };
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
              <Box key={record.id} mt={4}>
                <Card p={4} border="1px solid" borderColor="gray.200" borderRadius="md" boxShadow="lg">
                  <CardHeader>
                    <Text fontSize="xl" fontWeight="bold">
                      {record.job?.title}
                    </Text>
                  </CardHeader>
                  <CardBody>
                    <Text fontSize="md" fontWeight="medium">
                      Job Description
                    </Text>
                    <Text py={2} fontSize="sm" color="gray.600">
                      {record.job.description}
                    </Text>
                  </CardBody>
                  <CardBody>
                    <Text fontSize="md" fontWeight="medium">
                      Cover Letter
                    </Text>
                    <Text py={2} fontSize="sm" color="gray.600">
                      {record.coverLetter}
                    </Text>
                  </CardBody>
                  <Divider color="gray.200" mt={2} />
                  <CardFooter mt={2}>
                    <Badge colorScheme={getButtonColor(record.status as Status)} px={2} py={1} borderRadius="md">
                      {record.status}
                    </Badge>{' '}
                  </CardFooter>
                </Card>
              </Box>
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
