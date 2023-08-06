import { useState } from 'react';
import AppLayout from 'layout/app-layout';
import { Box, Text, Link, Flex, Center } from '@chakra-ui/react';
import useSWR from 'swr';
import { Spinner } from '@chakra-ui/react';
import { getApplications } from 'apiSdk/applications';
import { ApplicationInterface } from 'interfaces/application';
import { Error } from 'components/error';
import { AccessOperationEnum, AccessServiceEnum, requireNextAuth, useSession, withAuthorization } from '@roq/nextjs';
import { compose } from 'lib/compose';
import ApplicationCard from 'components/application/ApplicationCard';

function ApplicationListPage() {
  const session = useSession();
  console.log(session.session);
  const [deleteError, setDeleteError] = useState(null);
  const { data, error, isLoading, mutate } = useSWR<ApplicationInterface[]>(
    () => '/applications',
    () =>
      getApplications({
        relations: ['job', 'user'],
      }),
  );

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
              <ApplicationCard key={record.id} application={record} />
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
