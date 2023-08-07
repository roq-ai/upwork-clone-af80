import AppLayout from 'layout/app-layout';
import { useState } from 'react';
import { FormControl, FormLabel, Button, Text, Box, FormErrorMessage, Textarea, Stack } from '@chakra-ui/react';
import { useFormik, FormikHelpers } from 'formik';
import { useRouter } from 'next/router';
import { createApplication } from 'apiSdk/applications';
import { Error } from 'components/error';
import { applicationValidationSchema } from 'validationSchema/applications';
import { AccessOperationEnum, AccessServiceEnum, requireNextAuth, useSession, withAuthorization } from '@roq/nextjs';
import { compose } from 'lib/compose';
import { JobInterface } from 'interfaces/job';
import { UserInterface } from 'interfaces/user';
import { getJobById } from 'apiSdk/jobs';
import { getUsers } from 'apiSdk/users';
import useSWR from 'swr';
import { FileUpload } from '@roq/nextjs';

function ApplicationCreatePage() {
  const router = useRouter();
  const [error, setError] = useState(null);
  const [attachement, setAttachement] = useState('');
  const [attachementName, setAttachementName] = useState('');
  const { session } = useSession();

  const {
    data: currentUser,
    isLoading,
    mutate,
  } = useSWR<UserInterface[]>(
    () => '/users',
    () =>
      getUsers({
        email: session?.user?.email,
      }),
  );
  const currentId = router.query.job_id as string;
  const {
    data: currentJob,
    error: jobError,
    isLoading: jobLoading,
    mutate: jobMutate,
  } = useSWR<JobInterface>(
    () => (currentId ? `/jobs/${currentId}` : null),
    () =>
      getJobById(currentId, {
        relations: ['company', 'application'],
      }),
  );
  const handleSubmit = async (values: any, { resetForm }: FormikHelpers<any>) => {
    setError(null);
    try {
      await createApplication({
        ...values,
        attachement: attachement,
        attachementName: attachementName,
        job_id: values.job_id,
        status: 'submitted',
        user_id: currentUser?.[0].id,
      });

      resetForm();
      router.push('/applications');
    } catch (error) {
      setError(error);
    }
  };

  const formik = useFormik({
    initialValues: {
      coverLetter: '',
      job_id: (router.query.job_id as string) ?? null,
      attachement: '',
      attachementName: '',
    },
    validationSchema: applicationValidationSchema,
    onSubmit: handleSubmit,
    enableReinitialize: true,
    validateOnChange: false,
    validateOnBlur: false,
  });

  return (
    <AppLayout>
      <Box bg="white" p={8} rounded="md" shadow="md">
        <Box mb={4}>
          <Text as="h1" fontSize="2xl" fontWeight="bold">
            Apply For {currentJob?.title}
          </Text>
        </Box>
        <Box mb={4}>
          <Text as="h3" fontSize="lg" fontWeight="normal">
            {currentJob?.title}
          </Text>
          <Text as="h5" fontSize="md" marginTop="4" fontWeight="normal">
            {currentJob?.description}
          </Text>
        </Box>
        {error && (
          <Box mb={4}>
            <Error error={error} />
          </Box>
        )}
        <form onSubmit={formik.handleSubmit}>
          <FormControl id="status" mb="4" isInvalid={!!formik.errors?.coverLetter}>
            <FormLabel>Cover letter</FormLabel>
            <Textarea name="coverLetter" value={formik.values?.coverLetter} onChange={formik.handleChange} />
            {formik.errors.coverLetter && <FormErrorMessage>{formik.errors?.coverLetter}</FormErrorMessage>}
          </FormControl>
          <Box my={4}>
            <FileUpload
              accept={['image/*']}
              fileCategory="USER_FILES"
              onUploadSuccess={({ url, id, name, ...rest }) => {
                setAttachement(url);
                setAttachementName(name);
                formik.setFieldValue('attachement', url);
                // formik.setFieldValue('attachementName', name);
              }}
            />
            {formik.errors.attachement && <FormErrorMessage>{formik.errors?.attachement}</FormErrorMessage>}
          </Box>
          <Stack direction="row" justifyContent={'end'}>
            <Button isDisabled={formik?.isSubmitting || !currentUser} colorScheme="primary" type="submit" mr="4">
              Submit
            </Button>
          </Stack>
        </form>
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
    operation: AccessOperationEnum.CREATE,
  }),
)(ApplicationCreatePage);
