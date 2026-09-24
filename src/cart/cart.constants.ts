import type { ApiHeaderOptions } from '@nestjs/swagger';

/** Header carrying the client-generated guest cart id (UUID). */
export const CART_TOKEN_HEADER = 'x-cart-token';

export const CART_TOKEN_API_HEADER: ApiHeaderOptions = {
  name: 'X-Cart-Token',
  required: false,
  description:
    'Guest cart id (UUID) generated and stored by the client. Required for cart requests without an authenticated session, and used to merge the guest cart into the user cart on login.',
};
