import Joi from 'joi';

const schema = Joi.object({
  userID: Joi.string()
    .pattern(/^[a-z0-9]+$/)
    .min(6)
    .required()
    .messages({
      'string.pattern.base':
        '아이디는 영어 소문자와 숫자만 포함할 수 있습니다.',
      'string.min': '아이디는 최소 6자 이상이어야 합니다.',
      'any.required': '아이디는 필수 입력 항목입니다.',
    }),
  userPassword: Joi.string().min(6).required().messages({
    'string.min': '비밀번호는 최소 6자 이상이어야 합니다.',
    'any.required': '비밀번호는 필수 입력 항목입니다.',
  }),
});

export default schema;
