import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { Species } from '@modules/species/entities/species.entity';
import { Breed } from '@modules/breed/entities/breed.entity';

export class SpeciesBreedsSeed implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const speciesRepo = dataSource.getRepository(Species);
    const breedRepo = dataSource.getRepository(Breed);

    const speciesList = [
      { name: 'Chó', description: 'Giống chó' },
      { name: 'Mèo', description: 'Giống mèo' },
      { name: 'Khác', description: 'Loài khác' },
    ];

    const speciesMap: Record<string, number> = {};

    for (const speciesData of speciesList) {
      const existing = await speciesRepo.findOne({
        where: { name: speciesData.name },
      });

      if (existing) {
        await speciesRepo.update({ id: existing.id }, speciesData);
        console.log(`[SpeciesBreedsSeed] Updated species: ${speciesData.name}`);
        speciesMap[speciesData.name] = existing.id;
      } else {
        const species = speciesRepo.create(speciesData);
        await speciesRepo.save(species);
        console.log(`[SpeciesBreedsSeed] Created species: ${species.name}`);
        speciesMap[speciesData.name] = species.id;
      }
    }

    const breedsData = [
      {
        speciesName: 'Chó',
        breeds: [
          {
            name: 'Chó Việt Nam',
            description: 'Chó địa phương Việt Nam, lai tạp, phổ biến nhất',
          },
          {
            name: 'Chó Phú Quốc',
            description: 'Giống chó thuần Việt Nam có xoáy lông đặc trưng',
          },
          {
            name: "Chó H'Mông",
            description: 'Giống chó miền núi, to, lông xù',
          },
          {
            name: 'Chihuahua',
            description: 'Giống chó nhỏ nhất thế giới, nguồn gốc Mexico',
          },
          {
            name: 'Poodle',
            description: 'Giống chó thông minh, lông xoăn, nhiều kích cỡ',
          },
          {
            name: 'Golden Retriever',
            description: 'Giống chó lớn, thân thiện, hay nhất thế giới',
          },
          {
            name: 'Labrador',
            description:
              'Giống chó lớn, thân thiện, được huấn luyện làm chó dẫn đường',
          },
          {
            name: 'Husky',
            description: 'Giống chó kéo xe, lông dày, nguồn gốc Siberia',
          },
          {
            name: 'Pug',
            description: 'Giống chó nhỏ, mặt xệp, tính tình vui vẻ',
          },
          {
            name: 'Corgi',
            description: 'Giống chó chân ngắn, nguồn gốc Wales',
          },
          {
            name: 'Shiba Inu',
            description: 'Giống chó Nhật Bản, lông đỏ, tính độc lập',
          },
          {
            name: 'Maltese',
            description: 'Giống chó nhỏ, lông trắng dài, nguồn gốc Malta',
          },
          {
            name: 'French Bulldog',
            description: 'Giống chó nhỏ, mặt xệp, tai dơi',
          },
          {
            name: 'Beagle',
            description: 'Giống chó săn, mũi thính, tính vui vẻ',
          },
          {
            name: 'Dachshund',
            description: 'Giống chó chân dài, lông ngắn, Đức',
          },
          {
            name: 'Khác',
            description: 'Giống chó khác',
          },
        ],
      },
      {
        speciesName: 'Mèo',
        breeds: [
          {
            name: 'Mèo Mướp',
            description: 'Mèo địa phương Việt Nam, hoa văn la (tabby)',
          },
          {
            name: 'Mèo Vàng',
            description: 'Mèo lông cam (orange tabby), phổ biến ở Việt Nam',
          },
          {
            name: 'Mèo Đen',
            description: 'Mèo lông đen, địa phương Việt Nam',
          },
          {
            name: 'British Shorthair',
            description: 'Giống mèo Anh, lông ngắn, mặt tròn',
          },
          {
            name: 'Scottish Fold',
            description: 'Giống mèo tai cụp, nguồn gốc Scotland',
          },
          {
            name: 'Maine Coon',
            description: 'Giống mèo lớn, lông dài, nguồn gốc Mỹ',
          },
          {
            name: 'Siamese',
            description: 'Giống mèo Xiêm, lông ngắn, mắt xanh',
          },
          {
            name: 'Persian',
            description: 'Giống mèo Ba Tư, lông dài, mặt phẳng',
          },
          {
            name: 'Ragdoll',
            description: 'Giống mèo to, tính hiền, hay rời tay ra làm limp',
          },
          {
            name: 'Bengal',
            description: 'Giống mèo hoa văn báo, lai từ mèo hoang',
          },
          {
            name: 'Russian Blue',
            description: 'Giống mèo lông xám bạc, mắt xanh lục',
          },
          {
            name: 'Sphynx',
            description: 'Giống mèo không lông, da trần',
          },
          {
            name: 'Khác',
            description: 'Giống mèo khác',
          },
        ],
      },
    ];

    for (const { speciesName, breeds } of breedsData) {
      const speciesId = speciesMap[speciesName];

      for (const breedData of breeds) {
        const existing = await breedRepo.findOne({
          where: { name: breedData.name, speciesId },
        });

        if (existing) {
          await breedRepo.update(
            { id: existing.id },
            { ...breedData, speciesId },
          );
          console.log(`[SpeciesBreedsSeed] Updated breed: ${breedData.name}`);
          continue;
        }

        const breed = breedRepo.create({ ...breedData, speciesId });
        await breedRepo.save(breed);
        console.log(`[SpeciesBreedsSeed] Created breed: ${breed.name}`);
      }
    }
  }
}
