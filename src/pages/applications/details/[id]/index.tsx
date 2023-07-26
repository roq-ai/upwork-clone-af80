import { useState } from 'react';
import AppLayout from 'layout/app-layout';
import { Box, Text, Flex, Center, Divider, Badge } from '@chakra-ui/react';
import useSWR from 'swr';
import { Spinner } from '@chakra-ui/react';
import { Card, CardHeader, CardBody, CardFooter } from '@chakra-ui/react';
import { getApplicationById } from 'apiSdk/applications';
import { ApplicationInterface } from 'interfaces/application';
import { Error } from 'components/error';
import { AccessOperationEnum, AccessServiceEnum, requireNextAuth, withAuthorization, ChatWindow } from '@roq/nextjs';
import { useRouter } from 'next/router';
import { compose } from 'lib/compose';

function ApplicationDetailPage() {
  const router = useRouter();
  const id = router.query.id as string;
  const { data, error, isLoading } = useSWR<ApplicationInterface>(
    () => (id ? `/applications/${id}` : null),
    () =>
      getApplicationById(id, {
        relations: ['job', 'user'],
      }),
  );

  const [deleteError, setDeleteError] = useState(null);

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
            My Application Detail
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
            <Box key={data.id} mt={4}>
              <Card p={4} border="1px solid" borderColor="gray.200" borderRadius="md" boxShadow="lg">
                <CardHeader>
                  <Text fontSize="xl" fontWeight="bold">
                    {data.job?.title}
                  </Text>
                </CardHeader>
                <CardBody>
                  <Text fontSize="md" fontWeight="medium">
                    Cover Letter
                  </Text>
                  <Text py={2} fontSize="sm" color="gray.600" noOfLines={2}>
                    {data.coverLetter}
                  </Text>
                </CardBody>

                <CardBody>
                  <Text fontSize="md" fontWeight="medium">
                    Job Description
                  </Text>
                  <Text py={2} fontSize="sm" color="gray.600">
                    {data.job.description}
                  </Text>
                </CardBody>

                <Divider color="gray.200" mt={2} />
                <CardFooter mt={2}>
                  <Badge colorScheme={getButtonColor(data.status as Status)} px={2} py={1} borderRadius="md">
                    {data.status}
                  </Badge>{' '}
                </CardFooter>
                {data?.roqConversationId && (
                  <Box mt={12}>
                    <ChatWindow conversationId={data.roqConversationId} />
                  </Box>
                )}

                <Divider color="gray.100" mb={3} />
              </Card>
            </Box>
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
)(ApplicationDetailPage);
