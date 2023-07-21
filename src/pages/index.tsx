import { Button, Flex, Heading, Image, Text, Stack, useBreakpointValue, Box, Link } from '@chakra-ui/react';

import { signIn, signUp, requireNextAuth } from '@roq/nextjs';

import Head from 'next/head';
import { HelpBox } from 'components/help-box';

function HomePage() {
  return (
    <>
      <Head>
        <title>{`Upwork-clone`}</title>

        <meta
          name="description"
          content="Welcome to Upwork-clone, your gateway to a world of opportunities. Connect with clients, apply for jobs, and engage in meaningful conversations, all in one place."
        />
      </Head>

      <Stack minH={'100vh'} direction={{ base: 'column', md: 'row' }}>
        <Flex p={8} flex={1} align={'center'} justify={'center'}>
          <Stack position="relative" spacing={6} w={'full'} maxW={'lg'}>
            <HelpBox />
            <Image src="/roq.svg" alt="Logo" w="150px" mb="8" />
            <Heading fontSize={{ base: '3xl', md: '4xl', lg: '5xl' }}>
              <Text as={'span'}>Explore</Text>{' '}
              <Text
                as={'span'}
                position={'relative'}
                _after={{
                  content: "''",
                  width: 'full',
                  height: useBreakpointValue({ base: '20%', md: '30%' }),
                  position: 'absolute',
                  bottom: 1,
                  left: 0,
                  bg: 'lightgreen',
                  zIndex: -1,
                }}
              >
                {`Upwork-clone`}
              </Text>
            </Heading>
            <Text fontSize={{ base: 'md', lg: 'lg' }} color={'gray.500'}>
              {`Welcome to Upwork-clone, your gateway to a world of opportunities. Connect with clients, apply for jobs, and engage in meaningful conversations, all in one place.`}
            </Text>
            <Stack direction="column" spacing={4} className="roles-container">
              <Text fontSize="lg" fontWeight="bold">
                Company
              </Text>
              <Stack direction={{ base: 'column', md: 'row' }} spacing={4}>
                <Button
                  rounded="3xl"
                  colorScheme="primary"
                  size="lg"
                  _hover={{ bg: 'primaryDark' }}
                  onClick={() => signUp('job-poster')}
                >
                  Create Company
                </Button>
                <Button colorScheme="primary" rounded="3xl" size="lg" onClick={() => signIn('job-poster')}>
                  Login
                </Button>
              </Stack>

              <Text fontSize="lg" fontWeight="bold">
                Job Applicant
              </Text>
              <Stack direction={{ base: 'column', md: 'row' }} spacing={4}>
                <Button
                  rounded="3xl"
                  colorScheme="primary"
                  size="lg"
                  _hover={{ bg: 'primaryDark' }}
                  onClick={() => signUp('job-applicant')}
                >
                  Register as Applicant
                </Button>
                <Button colorScheme="primary" rounded="3xl" size="lg" onClick={() => signIn('job-applicant')}>
                  Login
                </Button>
              </Stack>
            </Stack>
          </Stack>
        </Flex>
        <Flex position="relative" flex={1}>
          <Image
            src={
              'https://images.unsplash.com/photo-1499750310107-5fef28a66643?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w0NjA3NjB8MHwxfHNlYXJjaHwxfHxmcmVlbGFuY2UlMkNqb2IlMjBzZWFyY2h8ZW58MHx8fHwxNjg5MTU5NzI0fDA&ixlib=rb-4.0.3&q=80&w=1080'
            }
            alt={'Login Image'}
            objectFit={'cover'}
          />
          <Box position="absolute" top="0" backgroundColor="rgba(0,0,0,0.6)" width="100%" py="2">
            <Text align="center" fontSize="sm" color="white">
              Photo by{' '}
              <Link
                href="https://unsplash.com/@andrewtneel?utm_source=roq-generator&utm_medium=referral"
                isExternal
                color="teal.200"
              >{`Andrew Neel`}</Link>{' '}
              on{' '}
              <Link
                href="https://unsplash.com/?utm_source=roq-generator&utm_medium=referral"
                isExternal
                color="teal.200"
              >
                Unsplash
              </Link>
            </Text>
          </Box>
        </Flex>
      </Stack>
    </>
  );
}

export default requireNextAuth({
  redirectIfAuthenticated: true,
  redirectTo: '/jobs',
})(HomePage);
