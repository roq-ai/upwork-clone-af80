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
  Stack, Divider
} from '@chakra-ui/react';
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
import { getApplications, updateApplicationById } from 'apiSdk/applications';
import { getUsers } from 'apiSdk/users';
import { UserInterface } from 'interfaces/user';
import { ApplicationInterface } from 'interfaces/application';
import Link from 'next/link';
import JobCardView from 'components/job/JobCardView';

function JobViewPage() {
  const { hasAccess } = useAuthorizationApi();
  const session = useSession();
  const currentRole = session.session.user.roles[0];
  const router = useRouter();
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
  const submitted = applications?.findIndex((app) => app?.job_id === id) !== -1;

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
              {hasAccess('job', AccessOperationEnum.READ, AccessServiceEnum.PROJECT) &&
                currentRole === 'job-applicant' && (
                  <Link href={`/applications/create/?job_id=${id}`}>
                    <Button isDisabled={submitted} variant="solid" colorScheme="primary">
                      {submitted ? 'Submitted' : 'Apply Now'}
                    </Button>
                  </Link>
                )}

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
                        <JobCardView
                          key={record.id}
                          application={record}
                          profileImage={record.user?.profileImage}
                          userNames={userNames}
                          onReject={applicationHandleReject}
                          onHire={handleHire}
                        />
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
