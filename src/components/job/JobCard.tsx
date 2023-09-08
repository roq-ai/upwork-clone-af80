import NextLink from 'next/link';
import { Text, Button, Icon, Divider, ButtonGroup, Stack } from '@chakra-ui/react';
import { Card, CardHeader, CardBody, CardFooter } from '@chakra-ui/react';
import { useAuthorizationApi, AccessServiceEnum, AccessOperationEnum } from '@roq/nextjs';
import { FiTrash2 } from 'react-icons/fi';
import { ApplicationInterface } from 'interfaces/application';
import { JobInterface } from 'interfaces/job';

interface JobCardProps {
  record: JobInterface;
  applications: ApplicationInterface[];
  currentRole: string;
  handleView(id: string): void;
  handleDelete(id: string): void;
}
function JobCard({ record, applications, currentRole, handleView, handleDelete }: JobCardProps) {
  const { hasAccess } = useAuthorizationApi();
  const submitted = applications?.findIndex((app) => app?.job_id === record?.id) !== -1;
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
    <Card mt={4} p={6} onClick={() => handleView(record.id)} key={record.id} variant={'outline'} cursor="pointer">
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
              <NextLink href={`/jobs/view/${record.id}`}>
                <Button variant="solid" colorScheme="primary">
                  View Applicants ({record?._count?.application ?? 0})
                </Button>
              </NextLink>
            )}

            {hasAccess('job', AccessOperationEnum.READ, AccessServiceEnum.PROJECT) &&
              currentRole === 'job-applicant' && (
                <NextLink href={`/applications/create/?job_id=${record.id}`}>
                  <Button isDisabled={submitted} variant="solid" colorScheme="primary">
                    {submitted ? 'Submitted' : 'Apply Now'}
                  </Button>
                </NextLink>
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
}
export default JobCard;
