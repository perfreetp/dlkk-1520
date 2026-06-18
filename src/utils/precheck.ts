import type { ApplicantInfo } from '@/types';
import { materialCategories } from '@/data/materials';

const FOCUS_MATERIAL_IDS = [
  'id-card-front',
  'graduation-cert',
  'teacher-exam',
  'mandarin',
  'physical-exam',
  'photo-cert'
];

const FOCUS_MATERIAL_MAP: Record<string, { name: string; tips: string }> = {
  'id-card-front': { name: '身份证（正反面）', tips: '携带原件，复印件正反面印在同一页' },
  'graduation-cert': { name: '毕业证书', tips: '核对姓名、证书编号等信息一致' },
  'teacher-exam': { name: '教师资格考试合格证明', tips: '核对姓名、身份证号、照片一致' },
  'mandarin': { name: '普通话等级证书', tips: '核对等级达标：语文二甲及以上，其他学科二乙及以上' },
  'physical-exam': { name: '体检表', tips: '近半年内有效，照片与本人一致' },
  'photo-cert': { name: '证件照', tips: '与上传电子版与提交版为同一张照片' }
};

export interface PrecheckItem {
  id: string;
  title: string;
  detail: string;
  /** 可点击按钮跳转目标 */
  actionTab?: 'material-check' | 'photo-organize';
  actionMaterialId?: string;
}

export interface PrecheckReport {
  passed: PrecheckItem[];
  needCheck: PrecheckItem[];
  isPassed: boolean;
  focusMaterials: Array<{
    id: string;
    name: string;
    tips: string;
    checked: boolean;
    hasPhoto: boolean;
  }>;
}

export function validateIdNumber(id: string): { valid: boolean; error?: string } {
  if (!id || id.trim() === '') {
    return { valid: false, error: '未填写' };
  }
  const trimmed = id.trim();
  if (trimmed.length !== 18) {
    return { valid: false, error: '身份证号应为18位' };
  }
  const idPattern = /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/;
  if (!idPattern.test(trimmed)) {
    return { valid: false, error: '身份证号格式不正确' };
  }
  return { valid: true };
}

export function buildPrecheckReport(
  info: ApplicantInfo,
  materialChecked: string[],
  photos: Array<{ materialId: string }>
): PrecheckReport {
  const passed: PrecheckItem[] = [];
  const needCheck: PrecheckItem[] = [];

  const idCheck = validateIdNumber(info.idNumber);

  if (info.name && info.name.trim().length >= 2) {
    passed.push({
      id: 'name',
      title: '姓名格式正确',
      detail: `申请人姓名：${info.name}`
    });
  } else {
    needCheck.push({
      id: 'name',
      title: '姓名未填写',
      detail: '请在上方填写申请人真实姓名',
      actionTab: 'material-check'
    });
  }

  if (idCheck.valid) {
    passed.push({
      id: 'idNumber',
      title: '身份证号格式规范',
      detail: '身份证号位数及校验码均正确'
    });
  } else {
    needCheck.push({
      id: 'idNumber',
      title: `身份证号${idCheck.error || '不规范'}`,
      detail: idCheck.error === '未填写'
        ? '请在上方填写18位居民身份证号'
        : `原因：${idCheck.error}，请核对后重新填写`,
      actionTab: 'material-check'
    });
  }

  FOCUS_MATERIAL_IDS.forEach(matId => {
    const meta = FOCUS_MATERIAL_MAP[matId];
    const checked = materialChecked.includes(matId);

    if (checked) {
      passed.push({
        id: `checked-${matId}`,
        title: `${meta.name}：已核对`,
        detail: '材料信息已确认无误'
      });
    } else {
      needCheck.push({
        id: `checked-${matId}`,
        title: `${meta.name}：未核对`,
        detail: `请确认${meta.name}，${meta.tips}`,
        actionTab: 'material-check',
        actionMaterialId: matId
      });
    }
  });

  FOCUS_MATERIAL_IDS.forEach(matId => {
    const meta = FOCUS_MATERIAL_MAP[matId];
    const hasPhoto = photos.some(p => p.materialId === matId);
    if (hasPhoto) {
      passed.push({
        id: `photo-${matId}`,
        title: `${meta.name}：已拍摄`,
        detail: '照片已上传，可用于材料核验'
      });
    } else {
      needCheck.push({
        id: `photo-${matId}`,
        title: `${meta.name}：未拍摄`,
        detail: `建议拍摄${meta.name}归档，方便存档与现场对照`,
        actionTab: 'photo-organize',
        actionMaterialId: matId
      });
    }
  });

  const isPassed = needCheck.length === 0;

  const focusMaterials = FOCUS_MATERIAL_IDS.map(id => ({
    id,
    name: FOCUS_MATERIAL_MAP[id].name,
    tips: FOCUS_MATERIAL_MAP[id].tips,
    checked: materialChecked.includes(id),
    hasPhoto: photos.some(p => p.materialId === id)
  }));

  // 去除重复项（通过项中可能同一材料既有 checked 和 photo 都通过）
  const seenPassed = new Set<string>();
  const uniquePassed: PrecheckItem[] = [];
  for (const item of passed) {
    if (!seenPassed.has(item.id)) {
      seenPassed.add(item.id);
      uniquePassed.push(item);
    }
  }

  const seenNeed = new Set<string>();
  const uniqueNeed: PrecheckItem[] = [];
  for (const item of needCheck) {
    if (!seenNeed.has(item.title.split('：')[0])) {
      seenNeed.add(item.title.split('：')[0]);
      uniqueNeed.push(item);
    }
  }

  return {
    passed: uniquePassed,
    needCheck: uniqueNeed,
    isPassed,
    focusMaterials
  };
}
