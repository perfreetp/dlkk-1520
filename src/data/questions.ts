import type { QuestionItem } from '@/types';

export const selfCheckQuestions: QuestionItem[] = [
  {
    id: 'q1',
    question: '您的学历是否达到要求？',
    options: [
      { label: '大专及以上', value: 'college_above', hint: '可申请幼儿园/小学/初中教师资格' },
      { label: '本科及以上', value: 'bachelor_above', hint: '可申请所有学段教师资格' },
      { label: '中专/高中', value: 'high_school', hint: '学历不达标，不能申请' },
      { label: '不确定', value: 'uncertain', hint: '建议先核实学历' }
    ]
  },
  {
    id: 'q2',
    question: '您是否已通过教师资格考试？',
    options: [
      { label: '是，笔试面试都通过了', value: 'all_passed', hint: '考试合格证明在有效期内即可认定' },
      { label: '只通过了笔试', value: 'written_only', hint: '还需通过面试才能申请认定' },
      { label: '都没通过', value: 'none_passed', hint: '需要先参加教师资格考试' },
      { label: '不清楚', value: 'uncertain', hint: '登录NTCE网站查询' }
    ]
  },
  {
    id: 'q3',
    question: '您的普通话等级是否达标？',
    options: [
      { label: '二级甲等及以上', value: 'level2a', hint: '符合所有学科要求' },
      { label: '二级乙等', value: 'level2b', hint: '除语文学科外均可申请' },
      { label: '三级及以下', value: 'level3', hint: '不达标，需要重新考试' },
      { label: '还没考', value: 'not_taken', hint: '需要先考取普通话证书' }
    ]
  },
  {
    id: 'q4',
    question: '您是否已完成体检？',
    options: [
      { label: '是，在指定医院做的', value: 'done_designated', hint: '体检合格，在有效期内即可' },
      { label: '做了但不是指定医院', value: 'done_other', hint: '可能不被认可，建议重新做' },
      { label: '还没做', value: 'not_done', hint: '认定前需到指定医院体检' },
      { label: '不清楚要求', value: 'uncertain', hint: '查看当地认定公告' }
    ]
  },
  {
    id: 'q5',
    question: '您的身份/户籍条件是否符合？',
    options: [
      { label: '本地户籍', value: 'local_hukou', hint: '可在户籍地申请' },
      { label: '持有本地居住证', value: 'local_residence', hint: '可在居住地申请' },
      { label: '本地高校在读', value: 'local_student', hint: '可在学校所在地申请' },
      { label: '都不符合', value: 'none', hint: '需要回户籍地或办理居住证' }
    ]
  }
];

export const regionPolicies = [
  {
    id: 'beijing',
    name: '北京市',
    highlights: [
      '每年春秋两次认定',
      '需提供北京市居住证或本市户籍',
      '体检需到指定医疗机构'
    ]
  },
  {
    id: 'shanghai',
    name: '上海市',
    highlights: [
      '每年春秋两次认定',
      '居住证需在有效期内',
      '在校生可在学校所在地申请'
    ]
  },
  {
    id: 'guangdong',
    name: '广东省',
    highlights: [
      '每年分批次认定',
      '支持省内异地认定',
      '体检表有效期6个月'
    ]
  },
  {
    id: 'jiangsu',
    name: '江苏省',
    highlights: [
      '每年春秋两次认定',
      '需到户籍地或居住地申请',
      '体检需在指定医院进行'
    ]
  },
  {
    id: 'zhejiang',
    name: '浙江省',
    highlights: [
      '每年分批次认定',
      '支持人事关系所在地申请',
      '电子证照逐步替代纸质材料'
    ]
  }
];

export const recognitionTypes = [
  { id: 'kindergarten', name: '幼儿园教师资格', description: '面向幼儿园教育教学' },
  { id: 'primary', name: '小学教师资格', description: '面向小学教育教学' },
  { id: 'junior', name: '初级中学教师资格', description: '面向初中教育教学' },
  { id: 'senior', name: '高级中学教师资格', description: '面向高中教育教学' },
  { id: 'vocational', name: '中等职业学校教师资格', description: '面向中职教育教学' }
];
