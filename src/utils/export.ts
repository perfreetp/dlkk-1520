import Taro from '@tarojs/taro';
import { materialCategories, agentInstructions, photoSpecs } from '@/data/materials';
import type { PhotoItem } from '@/types';

interface ExportContext {
  materialChecked: string[];
  submitChecked: string[];
  photos: PhotoItem[];
  applicantInfo?: {
    name: string;
    idNumber: string;
    checkPassed: boolean | null;
  };
}

export function generateExportText(ctx: ExportContext, title: string): string {
  const lines: string[] = [];
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  lines.push(`═══════════════════════════════════`);
  lines.push(`       ${title}`);
  lines.push(`═══════════════════════════════════`);
  lines.push(`生成时间：${dateStr}`);
  lines.push('');

  if (ctx.applicantInfo && ctx.applicantInfo.name) {
    lines.push('【申请人信息】');
    lines.push(`  姓    名：${ctx.applicantInfo.name}`);
    lines.push(`  身份证号：${maskIdNumber(ctx.applicantInfo.idNumber)}`);
    if (ctx.applicantInfo.checkPassed !== null) {
      lines.push(`  一致性检查：${ctx.applicantInfo.checkPassed ? '✅ 已通过' : '⚠️ 需重点核对'}`);
    }
    lines.push('');
  }

  lines.push('【材料清单核对】');
  let totalCount = 0;
  let checkedCount = 0;
  let photoCount = 0;

  materialCategories.forEach(cat => {
    lines.push('');
    lines.push(`  ▸ ${cat.name}`);
    cat.items.forEach(item => {
      totalCount++;
      const materialChecked = ctx.materialChecked.includes(item.id);
      const submitChecked = ctx.submitChecked.includes(item.id);
      const hasPhoto = ctx.photos.some(p => p.materialId === item.id);
      if (hasPhoto) photoCount++;
      if (materialChecked) checkedCount++;

      const statusParts: string[] = [];
      if (materialChecked) statusParts.push('材料✓');
      if (submitChecked) statusParts.push('提交✓');
      if (hasPhoto) statusParts.push('照片✓');
      if (!item.required) statusParts.push('选备');

      const status = statusParts.length > 0 ? `[${statusParts.join(' ')}]` : '[待准备]';

      lines.push(`    ${status} ${item.name}${item.required ? '（必需）' : ''}`);
      if (item.tips) {
        lines.push(`        💡 ${item.tips}`);
      }
    });
  });

  lines.push('');
  lines.push('【完成度统计】');
  lines.push(`  材料准备：${checkedCount}/${totalCount} 项`);
  lines.push(`  照片上传：${photoCount}/${totalCount} 项`);
  const materialPercent = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;
  lines.push(`  完成进度：${materialPercent}%`);
  lines.push('');

  if (ctx.applicantInfo?.checkPassed === false) {
    lines.push('【重点核对提醒】');
    lines.push('  ⚠️ 姓名和身份证号一致性检查未通过，请确认以下材料信息：');
    const keyMaterials = [
      '身份证（正反面）',
      '毕业证书',
      '教师资格考试合格证明',
      '普通话等级证书',
      '体检表'
    ];
    keyMaterials.forEach(m => {
      lines.push(`    • ${m}`);
    });
    lines.push('');
  }

  lines.push('【证件照规格】');
  lines.push(`  尺    寸：${photoSpecs.standard.size}`);
  lines.push(`  背    景：${photoSpecs.standard.background}`);
  lines.push(`  分 辨 率：${photoSpecs.standard.resolution}`);
  lines.push(`  格    式：${photoSpecs.standard.format}`);
  lines.push(`  文件大小：${photoSpecs.standard.fileSize}`);
  lines.push('');

  lines.push('【线下受理须知】');
  lines.push('  1. 请登录当地教育局官网或政务服务APP预约');
  lines.push('  2. 选择对应认定机构（户籍地或居住地教育局）');
  lines.push('  3. 建议提前15分钟到达办理现场');
  lines.push('');

  lines.push('【家属代办说明】');
  agentInstructions.requirements.forEach((req, idx) => {
    lines.push(`  ${idx + 1}. ${req}`);
  });
  lines.push(`  💡 ${agentInstructions.tips}`);
  lines.push('');

  lines.push('═══════════════════════════════════');
  lines.push('   教师资格认定材料准备助手');
  lines.push('   清单仅供参考，以当地要求为准');
  lines.push('═══════════════════════════════════');

  return lines.join('\n');
}

function maskIdNumber(id: string): string {
  if (!id || id.length < 8) return id || '';
  return id.slice(0, 4) + '**********' + id.slice(-4);
}

export async function saveExportToClipboard(text: string): Promise<boolean> {
  try {
    await Taro.setClipboardData({ data: text });
    return true;
  } catch (e) {
    console.error('[Export] clipboard error:', e);
    return false;
  }
}

export function generateExportFileName(type: string): string {
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  return `教师资格认定_${type}_${dateStr}.txt`;
}
