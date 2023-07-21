import * as yup from 'yup';

export const jobValidationSchema = yup.object().shape({
  title: yup.string().required(),
  description: yup.string().required(),
});
