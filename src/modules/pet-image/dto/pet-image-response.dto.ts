import { Expose } from 'class-transformer';

export class PetImageResponseDto {
  @Expose()
  id!: string;

  @Expose()
  petId!: string;

  @Expose()
  imageUrl!: string;

  @Expose()
  embedding!: number[] | null;

  @Expose()
  isPrimary!: boolean;

  @Expose()
  createdAt!: Date;
}
