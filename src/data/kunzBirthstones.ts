/**
 * George F. Kunz《The Curious Lore of Precious Stones》(1913, 公版)：
 * 十二诞生石票数表（八传统汇总）+ 大祭司胸甲十二石对照 + 水晶凝视章引文。
 * 由 research/pipeline 自动生成，请勿手改。
 */
export interface BirthstoneMonth {
  stone: string
  lists: number
}

export const BIRTHSTONES_BY_MONTH: Record<string, BirthstoneMonth[]> = {
  'January': [{ stone: 'Garnet', lists: 7 }, { stone: 'Hyacinth', lists: 2 }],
  'February': [{ stone: 'Amethyst', lists: 8 }, { stone: 'Hyacinth', lists: 1 }, { stone: 'Pearl', lists: 1 }, { stone: 'Jasper', lists: 5 }, { stone: 'Bloodstone', lists: 4 }, { stone: 'Sapphire', lists: 7 }, { stone: 'Diamond', lists: 2 }, { stone: 'Agate', lists: 5 }, { stone: 'Emerald', lists: 4 }, { stone: 'Chalcedony', lists: 1 }, { stone: 'Carnelian', lists: 1 }, { stone: 'Emerald', lists: 4 }, { stone: 'Agate', lists: 4 }, { stone: 'Chaleedony', lists: 3 }, { stone: 'Turquoise', lists: 1 }, { stone: 'S-eye', lists: 1 }, { stone: 'Onyx', lists: 5 }, { stone: 'Sardonyx', lists: 1 }, { stone: 'Carnelian', lists: 1 }, { stone: 'Ruby', lists: 1 }, { stone: 'Turquoise', lists: 1 }, { stone: 'Carnelian', lists: 5 }, { stone: 'Sardonyx', lists: 3 }, { stone: 'Moonstone', lists: 1 }, { stone: 'Topaz', lists: 1 }, { stone: 'Andrite', lists: 1 }],
  'September': [{ stone: 'Chrysolite', lists: 6 }, { stone: 'Sardonyx', lists: 2 }],
  'October': [{ stone: 'Aquamarine', lists: 5 }, { stone: 'Opal', lists: 1 }],
  'November': [{ stone: 'Topaz', lists: 8 }, { stone: 'Pearl', lists: 1 }],
  'December': [{ stone: 'Ruby', lists: 6 }, { stone: 'Turquoise', lists: 2 }, { stone: 'Chrysoprase', lists: 1 }, { stone: 'Bloodstone', lists: 1 }],
  'March': [{ stone: 'Jasper', lists: 5 }, { stone: 'Bloodstone', lists: 4 }],
  'April': [{ stone: 'Sapphire', lists: 7 }, { stone: 'Diamond', lists: 2 }],
  'May': [{ stone: 'Agate', lists: 5 }, { stone: 'Emerald', lists: 4 }, { stone: 'Chalcedony', lists: 1 }, { stone: 'Carnelian', lists: 1 }],
  'June': [{ stone: 'Emerald', lists: 4 }, { stone: 'Agate', lists: 4 }, { stone: 'Turquoise', lists: 1 }],
  'July': [{ stone: 'Onyx', lists: 5 }, { stone: 'Sardonyx', lists: 1 }],
  'August': [{ stone: 'Carnelian', lists: 5 }, { stone: 'Sardonyx', lists: 3 }, { stone: 'Moonstone', lists: 1 }],
}

export const BREASTPLATE_STONES: Array<{ no: string; authorizedVersion: string; laterCorrection: string; foundationStone: string }> = [
  { no: 'I', authorizedVersion: 'Sardius Carnelian Jasper', laterCorrection: '', foundationStone: '' },
  { no: 'II', authorizedVersion: 'Topaz Chrysolite Sapphire', laterCorrection: '(peridot)', foundationStone: '' },
  { no: 'III', authorizedVersion: 'Carbuncle Emerald Chalcedony', laterCorrection: '', foundationStone: '' },
  { no: 'IV', authorizedVersion: 'Emerald Ruby Emerald', laterCorrection: '', foundationStone: '' },
  { no: 'V', authorizedVersion: 'Sapphire Lapis-lazuli Sardonyx', laterCorrection: '', foundationStone: '' },
  { no: 'VI', authorizedVersion: 'Diamond Onyx Sardius', laterCorrection: '', foundationStone: '' },
  { no: 'VII', authorizedVersion: 'Ligure Sapphire Chrysolite', laterCorrection: '', foundationStone: '' },
  { no: 'VIII', authorizedVersion: 'Agate Agate Beryl', laterCorrection: '', foundationStone: '' },
  { no: 'IX', authorizedVersion: 'Amethyst Amethyst Topaz', laterCorrection: '', foundationStone: '' },
  { no: 'x', authorizedVersion: 'Beryl Topaz Chrysoprasus', laterCorrection: '', foundationStone: '' },
  { no: 'XI', authorizedVersion: 'Onyx Beryl Jacinth', laterCorrection: '', foundationStone: '' },
  { no: 'XII', authorizedVersion: 'Jasper Jasper Amethyst', laterCorrection: '', foundationStone: '' },
]

export const CRYSTAL_GAZING_PASSAGE = 'The Achaians, as Pausanius relates, frequently used a mirror to divine diseases or to learn whether there was danger of sudden death. Of the Temple of Demeter, or Ceres, at Patras, he writes: ?'
