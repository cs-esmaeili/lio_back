import type { ApiHeaderOptions } from '@nestjs/swagger';

export const CSRF_HEADER: ApiHeaderOptions = {
  name: 'X-CSRF-Token',
  required: true,
  description: 'CSRF token from GET /auth/csrf — copy the csrfToken field into this header.',
};
