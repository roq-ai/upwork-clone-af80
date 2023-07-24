import * as yup from 'yup';

export const applicationValidationSchema = yup.object().shape({
  coverLetter: yup.string().required(),
  job_id: yup.string().nullable().required(),
  attachement: yup.string().url(),
});
