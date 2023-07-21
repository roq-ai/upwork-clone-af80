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
import { createJob } from 'apiSdk/jobs';
import { Error } from 'components/error';
import { jobValidationSchema } from 'validationSchema/jobs';
import { AsyncSelect } from 'components/async-select';
import { ArrayFormField } from 'components/array-form-field';
import { AccessOperationEnum, AccessServiceEnum, requireNextAuth, useSession, withAuthorization } from '@roq/nextjs';
import { compose } from 'lib/compose';
import { CompanyInterface } from 'interfaces/company';
import { getCompanies } from 'apiSdk/companies';
import { JobInterface } from 'interfaces/job';
import useSWR from 'swr';
import { hire } from 'apiSdk/applications';

function JobCreatePage() {
  const router = useRouter();
  const [error, setError] = useState(null);
  const { session, status } = useSession();

  const {
    data: company,
    isLoading,
    mutate,
  } = useSWR<JobInterface[]>(
    () => '/jobs',
    () =>
      getCompanies({
        tenant_id: session.user.tenantId,
      }),
  );
  

  const handleSubmit = async (values: any, { resetForm }: FormikHelpers<any>) => {
    setError(null);
    try {
      // await hire({ jobTitle: application.job.title, userId: userId, applicantId: application.user_id });
      await createJob({ ...values, company_id: company?.[0].id });
      resetForm();
      router.push('/jobs');
    } catch (error) {
      setError(error);
    }
  };

  const formik = useFormik({
    initialValues: {
      title: '',
      description: '',
    },
    validationSchema: jobValidationSchema,
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
            Create Job
          </Text>
        </Box>
        {error && (
          <Box mb={4}>
            <Error error={error} />
          </Box>
        )}
        <form onSubmit={formik.handleSubmit}>
          <FormControl id="title" mb="4" isInvalid={!!formik.errors?.title}>
            <FormLabel>Title</FormLabel>
            <Input type="text" name="title" value={formik.values?.title} onChange={formik.handleChange} />
            {formik.errors.title && <FormErrorMessage>{formik.errors?.title}</FormErrorMessage>}
          </FormControl>
          <FormControl id="description" mb="4" isInvalid={!!formik.errors?.description}>
            <FormLabel>Description</FormLabel>
            <Textarea name="description" value={formik.values?.description} onChange={formik.handleChange} />
            {formik.errors.description && <FormErrorMessage>{formik.errors?.description}</FormErrorMessage>}
          </FormControl>
          <Button as={'button'} colorScheme="primary" type="submit" mr="4">
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
    entity: 'job',
    operation: AccessOperationEnum.CREATE,
  }),
)(JobCreatePage);
