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
import { AccessOperationEnum, AccessServiceEnum, FileUpload, requireNextAuth, useSession, withAuthorization } from '@roq/nextjs';
import { compose } from 'lib/compose';
import { JobInterface } from 'interfaces/job';
import { UserInterface } from 'interfaces/user';
import { getJobById, getJobs } from 'apiSdk/jobs';
import { getUsers } from 'apiSdk/users';
import { ApplicationInterface } from 'interfaces/application';
import useSWR from 'swr';
function ApplicationCreatePage() {
  const router = useRouter();
  const [error, setError] = useState(null);
  const { session } = useSession();
  const currentJobId = router.query.job_id as string;
  const {
    data: user,
    isLoading,
    mutate,
  } = useSWR<UserInterface[]>(
    () => '/users',
    () =>
      getUsers({
        email: session.user.email,
      }),
  );
  const {
    data: currentJob,
    error: jobError,
    isLoading: jobLoading,
    mutate: jobMutate,
  } = useSWR<JobInterface>(
    () => (currentJobId ? `/jobs/${currentJobId}` : null),
    () =>
      getJobById(currentJobId, {
        relations: ['company', 'application'],
      }),
  );
  const handleSubmit = async (values: any, { resetForm }: FormikHelpers<any>) => {
    setError(null);
    try {
      console.log(values);
      await createApplication({ ...values, status: 'submitted', user_id: user?.[0].id });
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
      <Box bg="white" p={4} rounded="md" shadow="md">
        <Box mb={4}>
          <Text as="h1" fontSize="2xl" fontWeight="bold">
            Apply for {currentJob?.title}
          </Text>
        </Box>
        <Box>
          <Text>{currentJob?.title}</Text>
          <Text mt={5} fontSize="md" fontWeight="bold">Job Description </Text>
          <Text as="h5" fontSize="md" fontWeight="normal" mt={2}>
            {currentJob?.description}
          </Text>
        </Box>
        {error && (
          <Box mb={4}>
            <Error error={error} />
          </Box>
        )}
        <form onSubmit={formik.handleSubmit}>
          <FormControl id="status" mt="4" mb="4" isInvalid={!!formik.errors?.coverLetter}>
            <FormLabel>Cover Letter</FormLabel>
            <Textarea name="coverLetter" value={formik.values?.coverLetter} onChange={formik.handleChange} />
            {formik.errors.coverLetter && <FormErrorMessage>{formik.errors?.coverLetter}</FormErrorMessage>}
          </FormControl>
          <Box my={4}>
          <FileUpload 
            accept={['image/*']}
            fileCategory="USER_FILES"
            onUploadSuccess={({url, id, ...rest}) =>{
              console.log({url, id, rest});
              formik.setFieldValue('attachement', url)
            }}
          />
          </Box>
          <Button isDisabled={formik?.isSubmitting} colorScheme="primary" type="submit" mr="4">
            Submit
          </Button>
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
