import AppLayout from 'layout/app-layout';
import React, { useState } from 'react';
import {
  FormControl,
  FormLabel,
  Input,
  Button,
  Text,
  Box,
  Spinner,
  FormErrorMessage,
  Switch,
  NumberInputStepper,
  NumberDecrementStepper,
  NumberInputField,
  NumberIncrementStepper,
  NumberInput,
  Textarea,
  Stack,
} from '@chakra-ui/react';
import { useFormik, FormikHelpers } from 'formik';
import * as yup from 'yup';
import DatePicker from 'react-datepicker';
import { FiEdit3 } from 'react-icons/fi';
import { useRouter } from 'next/router';
import { createApplication } from 'apiSdk/applications';
import { Error } from 'components/error';
import { applicationValidationSchema } from 'validationSchema/applications';
import { AsyncSelect } from 'components/async-select';
import { ArrayFormField } from 'components/array-form-field';
import { AccessOperationEnum, AccessServiceEnum, requireNextAuth, useSession, withAuthorization } from '@roq/nextjs';
import { compose } from 'lib/compose';
import { JobInterface } from 'interfaces/job';
import { UserInterface } from 'interfaces/user';
import { getJobById, getJobs } from 'apiSdk/jobs';
import { getUsers } from 'apiSdk/users';
import { ApplicationInterface } from 'interfaces/application';
import useSWR from 'swr';
import { FileUpload } from '@roq/nextjs';

function ApplicationCreatePage() {
  const router = useRouter();
  const [error, setError] = useState(null);
  const [attachement, setAttachement] = useState('');
  const { session } = useSession();
  // console.log({session});
  
  const {
    data: currentUser,
    isLoading,
    mutate,
  } = useSWR<UserInterface[]>(
    () => '/users',
    () =>
      getUsers({
        tenant_id: session?.user?.tenantId,
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
  // console.log({ currentUser });
  const handleSubmit = async (values: any, { resetForm }: FormikHelpers<any>) => {
    setError(null);
    try {
      await createApplication({
        ...values,
        attachement: attachement,
        job_id: values.job_id,
        status: 'submitted',
        user_id: currentUser?.[0].id,
      });
      // await hire({ jobTitle: currentJob.title, userId:currentJob.company.user_id, applicantId: user?.[0].id });
    
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
          {/* <Text as="h4" fontSize="sm" fontWeight="bold">
            Job Title: */}
          <Text as="h3" fontSize="lg" fontWeight="normal">
            {currentJob?.title}
          </Text>
          {/* </Text> */}
          {/* <Text as="h5" fontSize="sm" fontWeight="bold">
            Job Description:{' '} */}
          <Text as="h5" fontSize="md" marginTop="4" fontWeight="normal">
            {currentJob?.description}
          </Text>
          {/* </Text> */}
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
              onUploadSuccess={({ url, id, ...rest }) => {
                setAttachement(url);
                formik.setFieldValue('attachement', url);
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
