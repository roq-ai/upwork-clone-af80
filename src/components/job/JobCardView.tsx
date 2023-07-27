import { Box, Text, Avatar, Button, Flex, Divider, ButtonGroup, Icon, CardFooter, Card } from '@chakra-ui/react';
import { FiTrash } from 'react-icons/fi';
import { ApplicationInterface } from 'interfaces/application';
import { AccessOperationEnum, AccessServiceEnum, useAuthorizationApi } from '@roq/nextjs';

interface JobCardViewProps {
    application: ApplicationInterface;
    profileImage: string
    userNames: {
        [userId: string]: {
            userFirstName?: string;
            userLastName?: string;
            userEmail?: string;
        };
    };
    onReject(id: string, rest: ApplicationInterface): void;
    onHire(application: ApplicationInterface): void;
}

function JobCardView({ application, userNames, onReject, onHire, profileImage }: JobCardViewProps) {
    const { hasAccess } = useAuthorizationApi();
    const { user_id, coverLetter, status } = application;

    return (
        <Card variant="outline" borderWidth="1px" borderRadius="md" p={4}>
            <Flex alignItems="center">
                <Avatar src={profileImage} mr={4} />
                <Box flex="1">
                    <Text fontSize="lg" fontWeight="bold">
                        {userNames[user_id]?.userFirstName} {userNames[user_id]?.userLastName}
                    </Text>
                    <Text as="span" color={'gray.500'} lineHeight="1">
                        {userNames[user_id]?.userEmail}
                    </Text>
                </Box>
            </Flex>
            <Flex>
                <Text color="gray.600" mt={4} ml={12} fontWeight="medium">
                    Cover Letter:
                </Text>
                <Text color="gray.600" fontWeight="normal" mt={4} ml={2} noOfLines={2}>
                    {coverLetter}
                </Text>
            </Flex>

            <Divider color="gray.200" mt={4} mb={2} />
            <CardFooter>
                <ButtonGroup spacing="3">
                    {hasAccess('application', AccessOperationEnum.UPDATE, AccessServiceEnum.PROJECT) &&
                        status !== 'Rejected' && (
                            <Button
                                isDisabled={status === 'Hired'}
                                colorScheme="primary"
                                onClick={() => onHire(application)}
                            >
                                {status === 'Hired' ? 'Hired' : 'Hire'}
                            </Button>
                        )}
                    {hasAccess('application', AccessOperationEnum.DELETE, AccessServiceEnum.PROJECT) &&
                        status !== 'Hired' && (
                            <Button
                                isDisabled={status === 'Rejected'}
                                leftIcon={<Icon as={FiTrash} />}
                                onClick={() => onReject(application.id, application)}
                                variant="outline"
                                colorScheme="red"
                            >
                                {status === 'Rejected' ? 'Rejected' : 'Reject'}
                            </Button>
                        )}
                </ButtonGroup>
            </CardFooter>
        </Card>
    );
}

export default JobCardView;
