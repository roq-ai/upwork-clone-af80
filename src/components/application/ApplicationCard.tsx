import { Box, Text, Link, Card, CardHeader, CardBody, Divider } from '@chakra-ui/react';
import { ApplicationInterface } from 'interfaces/application';

interface ApplicationCardProps {
  application: ApplicationInterface;
}
function ApplicationCard({ application }: ApplicationCardProps) {
  const { id, job, coverLetter } = application;

  return (
    <Link href={`/applications/details/${id}`} key={id} cursor="pointer" _hover={{ textDecoration: 'none' }}>
      <Box mt={4}>
        <Card p={4} border="1px solid" borderColor="gray.100" borderRadius="md">
          <CardHeader>
            <Text fontSize="xl" fontWeight="bold">
              {job?.title}
            </Text>
          </CardHeader>
          <CardBody>
            <Text fontSize="md" fontWeight="medium">
              Cover Letter
            </Text>
            <Text py={2} fontSize="sm" color="gray.600" noOfLines={5}>
              {coverLetter}
            </Text>
          </CardBody>
          <Divider color="gray.100" mb={3} />
        </Card>
      </Box>
    </Link>
  );
}
export default ApplicationCard;
