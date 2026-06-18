import type { MaterialCategory } from '@/types';

export const materialCategories: MaterialCategory[] = [
  {
    id: 'identity',
    name: '身份证明',
    items: [
      {
        id: 'id-card-front',
        name: '身份证正面',
        category: 'identity',
        required: true,
        description: '第二代居民身份证人像面',
        tips: '确保姓名、身份证号清晰可见，四角完整',
        photoSpec: '尺寸：85.6mm×54mm，分辨率≥300dpi',
        expiryCheck: true
      },
      {
        id: 'id-card-back',
        name: '身份证反面',
        category: 'identity',
        required: true,
        description: '第二代居民身份证国徽面',
        tips: '注意有效期，过期身份证不能使用',
        photoSpec: '尺寸：85.6mm×54mm，分辨率≥300dpi',
        expiryCheck: true
      }
    ]
  },
  {
    id: 'education',
    name: '学历证明',
    items: [
      {
        id: 'diploma',
        name: '毕业证书',
        category: 'education',
        required: true,
        description: '最高学历毕业证书',
        tips: '毕业证书上的姓名须与身份证一致',
        photoSpec: '清晰拍摄完整证书，文字可辨认'
      },
      {
        id: 'degree-cert',
        name: '学位证书',
        category: 'education',
        required: false,
        description: '如有学位证书可一并提供',
        tips: '非必需材料，但建议准备',
        photoSpec: '清晰拍摄完整证书'
      },
      {
        id: 'xuexin-report',
        name: '学历认证报告',
        category: 'education',
        required: true,
        description: '学信网学历证书电子注册备案表',
        tips: '需在有效期内，建议提前申请',
        expiryCheck: true
      }
    ]
  },
  {
    id: 'teacher-qual',
    name: '教师资格相关',
    items: [
      {
        id: 'exam-cert',
        name: '教师资格考试合格证明',
        category: 'teacher-qual',
        required: true,
        description: '中小学教师资格考试合格证明',
        tips: '在NTCE网站可下载，注意有效期',
        expiryCheck: true
      },
      {
        id: 'mandarin-cert',
        name: '普通话水平测试等级证书',
        category: 'teacher-qual',
        required: true,
        description: '二级乙等及以上（语文需二级甲等）',
        tips: '语文学科要求二级甲等及以上',
        photoSpec: '证书照片清晰，等级可辨'
      }
    ]
  },
  {
    id: 'physical',
    name: '体检材料',
    items: [
      {
        id: 'physical-report',
        name: '体检表',
        category: 'physical',
        required: true,
        description: '教师资格认定体检表',
        tips: '需到指定医院体检，在有效期内',
        expiryCheck: true
      }
    ]
  },
  {
    id: 'photo',
    name: '证件照片',
    items: [
      {
        id: 'passport-photo',
        name: '近期免冠证件照',
        category: 'photo',
        required: true,
        description: '白色背景的一寸免冠照片',
        tips: '与网上报名时上传的照片为同一底版',
        photoSpec: '一寸（25mm×35mm），白色背景，免冠正面'
      }
    ]
  },
  {
    id: 'other',
    name: '其他材料',
    items: [
      {
        id: 'household-register',
        name: '户籍证明/居住证',
        category: 'other',
        required: true,
        description: '户籍簿或居住证等居住证明',
        tips: '在户籍地或居住地申请均需提供'
      },
      {
        id: 'work-cert',
        name: '工作证明/在读证明',
        category: 'other',
        required: false,
        description: '在职人员提供工作证明，在校生提供在读证明',
        tips: '根据自身情况准备'
      },
      {
        id: '思想品德',
        name: '思想品德鉴定表',
        category: 'other',
        required: true,
        description: '申请人思想品德鉴定表',
        tips: '由工作单位或户籍所在地街道办填写盖章'
      }
    ]
  }
];

export const photoSpecs = {
  standard: {
    size: '一寸（25mm×35mm）',
    background: '白色背景',
    resolution: '分辨率≥300dpi',
    format: 'JPG/JPEG格式',
    fileSize: '文件大小：20KB-200KB',
    requirements: [
      '免冠正面照片，露出双耳和眉毛',
      '不戴帽子、头巾、墨镜',
      '常戴眼镜者应佩戴眼镜',
      '照片清晰，无污迹和破损'
    ]
  }
};

export const agentInstructions = {
  title: '家属代办说明',
  requirements: [
    '代办人需携带本人身份证原件',
    '需提供申请人签名的委托书',
    '需携带申请人全部材料原件',
    '部分环节可能需要本人到场，请提前咨询'
  ],
  tips: '建议优先本人办理，确需代办的请提前电话确认当地政策'
};
