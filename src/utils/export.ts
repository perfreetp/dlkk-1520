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
  /** 预检附加信息（通过项/需核对项） */
  precheckInfo?: {
    passed: { title: string; detail: string }[];
    needCheck: { title: string; detail: string }[];
    isPassed: boolean;
  };
}

/**
 * 生成层级清晰的可打印版材料清单文本
 * 结构：
 * ━━━ 标题栏 ━━━
 * 一、申请人信息
 * 二、预审报告结论（如有）
 *   2.1 通过项
 *   2.2 需核对项
 * 三、按现场提交顺序排列的材料清单
 *   3.1 身份证明类
 *   3.2 学历证明类
 *   ...
 * 四、完成度统计
 * 五、证件照规格
 * 六、线下受理提醒
 * 七、家属代办说明
 * ━━━ 底部信息 ━━━
 */
export function generateExportText(ctx: ExportContext, title: string): string {
  const lines: string[] = [];
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const hr = '━'.repeat(44);
  const hrLight = '─'.repeat(40);

  lines.push(hr);
  lines.push(`       ${title}`);
  lines.push(`       生成时间：${dateStr}`);
  lines.push(hr);
  lines.push('');

  // ============================================================
  // 一、申请人信息
  // ============================================================
  lines.push('【一】申请人信息');
  if (ctx.applicantInfo && ctx.applicantInfo.name) {
    lines.push(`  姓    名：${ctx.applicantInfo.name}`);
    lines.push(`  身份证号：${maskIdNumber(ctx.applicantInfo.idNumber)}`);
    if (ctx.applicantInfo.checkPassed !== null) {
      lines.push(`  一致性检查：${ctx.applicantInfo.checkPassed ? '✅ 通过' : '⚠️ 需核对（详见下文预审报告）'}`);
    }
  } else {
    lines.push('  （未填写，建议返回"材料预检"页面填写申请人信息）');
  }
  lines.push('');

  // ============================================================
  // 二、预审报告结论
  // ============================================================
  lines.push(hrLight);
  lines.push('');
  lines.push('【二】预审报告结论');
  if (ctx.precheckInfo) {
    if (ctx.precheckInfo.isPassed) {
      lines.push('  ✅ 状态：全部通过');
      lines.push(`     通过项 ${ctx.precheckInfo.passed.length} 项 / 需核对项 ${ctx.precheckInfo.needCheck.length} 项`);
    } else {
      lines.push('  ⚠️ 状态：需核对项待处理');
      lines.push(`     通过项 ${ctx.precheckInfo.passed.length} 项 / 需核对项 ${ctx.precheckInfo.needCheck.length} 项`);
    }
    lines.push('');

    if (ctx.precheckInfo.passed.length > 0) {
      lines.push('  ┌─ 2.1 通过项 ──────────────');
      ctx.precheckInfo.passed.forEach((item, idx) => {
        lines.push(`  │ ${String(idx + 1).padStart(2, ' ')}. ${item.title}`);
        lines.push(`  │      ${item.detail}`);
      });
      lines.push('  └────────────────────────────');
      lines.push('');
    }

    if (ctx.precheckInfo.needCheck.length > 0) {
      lines.push('  ┌─ 2.2 需核对项（重点关注） ─');
      ctx.precheckInfo.needCheck.forEach((item, idx) => {
        lines.push(`  │ ${String(idx + 1).padStart(2, ' ')}. ⚠️ ${item.title}`);
        lines.push(`  │      ${item.detail}`);
      });
      lines.push('  └────────────────────────────');
      lines.push('');
    }
  } else if (ctx.applicantInfo?.checkPassed !== null) {
    // 没有传 precheckInfo，但有 applicantInfo 的简易版本
    if (ctx.applicantInfo.checkPassed) {
      lines.push('  ✅ 姓名与身份证号一致性检查通过');
    } else {
      lines.push('  ⚠️ 姓名与身份证号需重点核对，以下材料请逐一确认：');
      const keyMaterials = [
        '身份证（正反面）',
        '毕业证书',
        '教师资格考试合格证明',
        '普通话等级证书',
        '体检表'
      ];
      keyMaterials.forEach(m => lines.push(`    • ${m}`));
    }
    lines.push('');
  } else {
    lines.push('  （未生成预审报告，建议返回"材料预检"填写信息后再导出）');
    lines.push('');
  }

  // ============================================================
  // 三、按现场提交顺序的材料清单
  // ============================================================
  lines.push(hrLight);
  lines.push('');
  lines.push('【三】按现场提交顺序排列的材料清单');
  lines.push('');

  // 提交顺序分类（按要求调整过的）
  const submitOrderCategories = [
    { name: '身份证明', key: 'identity' },
    { name: '学历证明', key: 'education' },
    { name: '教师资格相关', key: 'teacher-qual' },
    { name: '体检材料', key: 'physical' },
    { name: '其他材料', key: 'other' },
    { name: '证件照片', key: 'photo' }
  ];

  let totalCount = 0;
  let checkedCount = 0;
  let photoCount = 0;
  let runningNum = 0;

  submitOrderCategories.forEach(group => {
    const cat = materialCategories.find(c => c.id === group.key);
    if (!cat) return;
    // 只取必需项
    const requiredItems = cat.items.filter(i => i.required);
    const optionalItems = cat.items.filter(i => !i.required);

    if (requiredItems.length === 0 && optionalItems.length === 0) return;

    lines.push(`  【第${submitOrderCategories.indexOf(group) + 1}组】${group.name}`);

    // 必需项
    requiredItems.forEach(item => {
      runningNum++;
      totalCount++;
      const matChecked = ctx.materialChecked.includes(item.id);
      const hasPhoto = ctx.photos.some(p => p.materialId === item.id);
      if (matChecked) checkedCount++;
      if (hasPhoto) photoCount++;

      const statusParts: string[] = [];
      if (matChecked) statusParts.push('✓已核对');
      if (hasPhoto) statusParts.push('✓有照片');
      const status = statusParts.length > 0 ? statusParts.join(' | ') : '待准备';

      lines.push(`    ${String(runningNum).padStart(2, ' ')}. [${status}]`);
      lines.push(`         ${item.name}（必需）`);
      if (item.tips) {
        lines.push(`         💡 ${item.tips}`);
      }
    });

    // 选备项
    optionalItems.forEach(item => {
      totalCount++;
      const matChecked = ctx.materialChecked.includes(item.id);
      const hasPhoto = ctx.photos.some(p => p.materialId === item.id);
      if (matChecked) checkedCount++;
      if (hasPhoto) photoCount++;

      const statusParts: string[] = [];
      if (matChecked) statusParts.push('✓已准备');
      if (hasPhoto) statusParts.push('✓有照片');
      const status = statusParts.length > 0 ? statusParts.join(' | ') : '选备';

      lines.push(`        * [${status}] ${item.name}（选备）`);
    });

    lines.push('');
  });

  // ============================================================
  // 四、完成度统计
  // ============================================================
  lines.push(hrLight);
  lines.push('');
  lines.push('【四】完成度统计');
  const materialPercent = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;
  const photoPercent = totalCount > 0 ? Math.round((photoCount / totalCount) * 100) : 0;
  lines.push(`  材料核对：${checkedCount}/${totalCount} 项（${materialPercent}%）`);
  lines.push(`  照片上传：${photoCount}/${totalCount} 项（${photoPercent}%）`);
  const barLen = 30;
  const filledMat = Math.round(materialPercent / 100 * barLen);
  const filledPhoto = Math.round(photoPercent / 100 * barLen);
  lines.push(`  核对进度：[${'█'.repeat(filledMat)}${'░'.repeat(barLen - filledMat)}] ${materialPercent}%`);
  lines.push(`  照片进度：[${'▓'.repeat(filledPhoto)}${'░'.repeat(barLen - filledPhoto)}] ${photoPercent}%`);
  lines.push('');

  // ============================================================
  // 五、证件照规格
  // ============================================================
  lines.push(hrLight);
  lines.push('');
  lines.push('【五】证件照规格要求');
  lines.push(`  • 尺    寸：${photoSpecs.standard.size}`);
  lines.push(`  • 背    景：${photoSpecs.standard.background}`);
  lines.push(`  • 分 辨 率：${photoSpecs.standard.resolution}`);
  lines.push(`  • 格    式：${photoSpecs.standard.format}`);
  lines.push(`  • 文件大小：${photoSpecs.standard.fileSize}`);
  lines.push('');
  lines.push('  拍摄要点：');
  photoSpecs.standard.requirements.forEach((req, idx) => {
    lines.push(`    ${idx + 1}. ${req}`);
  });
  lines.push('');

  // ============================================================
  // 六、线下受理提醒
  // ============================================================
  lines.push(hrLight);
  lines.push('');
  lines.push('【六】线下受理提醒（必读）');
  lines.push('  1️⃣ 请登录当地教育局官网或政务服务APP预约线下受理时间');
  lines.push('  2️⃣ 选择对应认定机构（户籍地或居住地教育局）');
  lines.push('  3️⃣ 所有复印件请使用 A4 纸，按本清单顺序装订');
  lines.push('  4️⃣ 请携带所有材料原件前往，用于现场核验');
  lines.push('  5️⃣ 建议提前 15 分钟到达办理现场');
  lines.push('  6️⃣ 如发现信息不一致，请提前到相关部门开具证明材料');
  lines.push('');
  lines.push('  ⚠️ 特别提醒：');
  lines.push('     • 现场核验时原件会比对，请确保证件真实有效');
  lines.push('     • 体检表必须在有效期内（通常为半年内）');
  lines.push('     • 部分地区支持邮寄材料，无需本人到场，请提前确认');
  lines.push('');

  // ============================================================
  // 七、家属代办说明
  // ============================================================
  lines.push(hrLight);
  lines.push('');
  lines.push('【七】家属代办说明');
  agentInstructions.requirements.forEach((req, idx) => {
    lines.push(`  ${idx + 1}. ${req}`);
  });
  lines.push(`  💡 ${agentInstructions.tips}`);
  lines.push('');

  // ============================================================
  // 底部
  // ============================================================
  lines.push(hr);
  lines.push('  本清单由「教师资格认定材料准备助手」生成');
  lines.push('  仅供个人材料整理参考，正式要求以当地教育局公告为准');
  lines.push(`  打印日期：${dateStr}`);
  lines.push(hr);

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
