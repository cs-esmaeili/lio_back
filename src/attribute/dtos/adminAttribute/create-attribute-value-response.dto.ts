import { AdminAttributeDto } from './admin-attribute.dto';

/** Value mutations return the whole attribute so the editor can replace it in one step. */
export class CreateAttributeValueResponseDto extends AdminAttributeDto {}
