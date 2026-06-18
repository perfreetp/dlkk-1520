import React, { useState, useMemo } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { selfCheckQuestions, regionPolicies, recognitionTypes } from '@/data/questions';
import type { SelfCheckResult } from '@/types';
import ProgressBar from '@/components/ProgressBar';

type Step = 'select' | 'quiz' | 'result';

const SelfCheckPage: React.FC = () => {
  const [step, setStep] = useState<Step>('select');
  const [selectedType, setSelectedType] = useState(recognitionTypes[1]);
  const [selectedRegion, setSelectedRegion] = useState(regionPolicies[0]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showRegionModal, setShowRegionModal] = useState(false);

  const currentQuestion = selfCheckQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / selfCheckQuestions.length) * 100;
  const currentAnswer = answers[currentQuestion?.id] || '';

  const result: SelfCheckResult = useMemo(() => {
    let score = 100;
    const warnings: string[] = [];
    const suggestions: string[] = [];

    const q1Answer = answers['q1'];
    if (q1Answer === 'high_school') {
      score -= 40;
      warnings.push('学历未达到申请要求，至少需大专及以上学历');
      suggestions.push('建议先提升学历，或考虑其他职业方向');
    } else if (q1Answer === 'uncertain') {
      score -= 10;
      warnings.push('请核实您的学历是否符合要求');
      suggestions.push('登录学信网查询您的学历信息');
    }

    const q2Answer = answers['q2'];
    if (q2Answer === 'none_passed') {
      score -= 30;
      warnings.push('尚未通过教师资格考试，不能申请认定');
      suggestions.push('先报名参加中小学教师资格考试');
    } else if (q2Answer === 'written_only') {
      score -= 20;
      warnings.push('仅通过笔试，还需通过面试');
      suggestions.push('报名参加面试考试，通过后再申请认定');
    } else if (q2Answer === 'uncertain') {
      score -= 5;
      suggestions.push('登录NTCE网站查询考试成绩');
    }

    const q3Answer = answers['q3'];
    if (q3Answer === 'level3') {
      score -= 20;
      warnings.push('普通话等级未达标');
      suggestions.push('报名参加普通话水平测试，争取二级乙等及以上');
    } else if (q3Answer === 'not_taken') {
      score -= 15;
      warnings.push('还未考取普通话证书');
      suggestions.push('尽快报名参加普通话水平测试');
    } else if (q3Answer === 'level2b') {
      suggestions.push('如申请语文学科，需二级甲等及以上');
    }

    const q4Answer = answers['q4'];
    if (q4Answer === 'not_done') {
      score -= 10;
      warnings.push('还未进行体检');
      suggestions.push('认定前需到当地指定医院完成体检');
    } else if (q4Answer === 'done_other') {
      score -= 5;
      warnings.push('非指定医院的体检报告可能不被认可');
      suggestions.push('建议到当地教育局指定的医院重新体检');
    } else if (q4Answer === 'uncertain') {
      suggestions.push('查看当地认定公告，了解体检要求');
    }

    const q5Answer = answers['q5'];
    if (q5Answer === 'none') {
      score -= 15;
      warnings.push('不符合当地申请的身份/户籍条件');
      suggestions.push('回户籍所在地申请，或办理当地居住证');
    }

    return {
      passed: score >= 60,
      score: Math.max(0, Math.min(100, score)),
      warnings,
      suggestions
    };
  }, [answers]);

  const handleStart = () => {
    setStep('quiz');
    setCurrentQuestionIndex(0);
    setAnswers({});
  };

  const handleSelectOption = (value: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value
    }));
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleNext = () => {
    if (!currentAnswer) return;
    if (currentQuestionIndex < selfCheckQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setStep('result');
    }
  };

  const handleRestart = () => {
    setStep('select');
    setCurrentQuestionIndex(0);
    setAnswers({});
  };

  const handleSelectType = (type: typeof recognitionTypes[0]) => {
    setSelectedType(type);
    setShowTypeModal(false);
  };

  const handleSelectRegion = (region: typeof regionPolicies[0]) => {
    setSelectedRegion(region);
    setShowRegionModal(false);
  };

  console.log('[SelfCheck] step:', step, 'type:', selectedType.name, 'region:', selectedRegion.name);

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <Text className={styles.title}>教师资格认定</Text>
        <Text className={styles.subtitle}>先自查再准备，避免白跑一趟</Text>
      </View>

      {step === 'select' && (
        <>
          <View className={styles.selectorCard}>
            <View className={styles.selectorRow} onClick={() => setShowTypeModal(true)}>
              <Text className={styles.selectorLabel}>认定类型</Text>
              <View className={styles.selectorValue}>
                <Text>{selectedType.name}</Text>
                <Text className={styles.chevron}>›</Text>
              </View>
            </View>
            <View className={styles.selectorRow} onClick={() => setShowRegionModal(true)}>
              <Text className={styles.selectorLabel}>申请地区</Text>
              <View className={styles.selectorValue}>
                <Text>{selectedRegion.name}</Text>
                <Text className={styles.chevron}>›</Text>
              </View>
            </View>
          </View>

          <View className={styles.policyCard}>
            <Text className={styles.policyTitle}>
              <Text>📍</Text> {selectedRegion.name} 认定要点
            </Text>
            <View className={styles.policyList}>
              {selectedRegion.highlights.map((item, idx) => (
                <View key={idx} className={styles.policyItem}>
                  <View className={styles.policyDot} />
                  <Text>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          <Button className={styles.startBtn} onClick={handleStart}>
            开始资格自测
          </Button>
        </>
      )}

      {step === 'quiz' && currentQuestion && (
        <View className={styles.quizCard}>
          <View className={styles.progressInfo}>
            <Text className={styles.progressText}>答题进度</Text>
            <Text className={styles.questionIndex}>
              {currentQuestionIndex + 1} / {selfCheckQuestions.length}
            </Text>
          </View>
          <ProgressBar percent={progress} size="lg" color="primary" />

          <Text className={styles.questionTitle}>{currentQuestion.question}</Text>

          <View className={styles.options}>
            {currentQuestion.options.map(option => (
              <View
                key={option.value}
                className={classnames(
                  styles.optionItem,
                  currentAnswer === option.value && styles.optionSelected
                )}
                onClick={() => handleSelectOption(option.value)}
              >
                <Text className={styles.optionLabel}>{option.label}</Text>
                {option.hint && (
                  <Text className={styles.optionHint}>{option.hint}</Text>
                )}
              </View>
            ))}
          </View>

          <View className={styles.navButtons}>
            <Button
              className={classnames(styles.navBtn, styles.prevBtn)}
              onClick={handlePrev}
              disabled={currentQuestionIndex === 0}
            >
              上一题
            </Button>
            <Button
              className={classnames(
                styles.navBtn,
                styles.nextBtn,
                !currentAnswer && styles.nextBtnDisabled
              )}
              onClick={handleNext}
              disabled={!currentAnswer}
            >
              {currentQuestionIndex === selfCheckQuestions.length - 1 ? '查看结果' : '下一题'}
            </Button>
          </View>
        </View>
      )}

      {step === 'result' && (
        <>
          <View className={styles.resultCard}>
            <View className={styles.resultHeader}>
              <View
                className={styles.scoreRing}
                style={{ ['--progress' as any]: `${result.score}%` }}
              >
                <Text className={styles.scoreValue}>{result.score}</Text>
              </View>
              <Text className={styles.scoreLabel}>
                {result.passed ? '基本符合条件' : '暂不符合条件'}
              </Text>
              <Text className={styles.scoreDesc}>
                {result.passed
                  ? '可以开始准备认定材料了'
                  : '建议先解决以下问题再申请'}
              </Text>
            </View>

            {result.warnings.length > 0 && (
              <View className={styles.resultSection}>
                <Text className={styles.resultSectionTitle}>
                  <Text>⚠️</Text> 需要注意
                </Text>
                <View className={styles.warningList}>
                  {result.warnings.map((item, idx) => (
                    <View key={idx} className={styles.warningItem}>
                      <Text className={styles.warningIcon}>!</Text>
                      <Text className={styles.warningText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {result.suggestions.length > 0 && (
              <View className={styles.resultSection}>
                <Text className={styles.resultSectionTitle}>
                  <Text>💡</Text> 行动建议
                </Text>
                {result.suggestions.map((item, idx) => (
                  <View key={idx} className={styles.suggestionItem}>
                    <Text className={styles.suggestionIcon}>→</Text>
                    <Text className={styles.suggestionText}>{item}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <Button className={styles.restartBtn} onClick={handleRestart}>
            重新自测
          </Button>
        </>
      )}

      {showTypeModal && (
        <View className={styles.typeSelectorModal} onClick={() => setShowTypeModal(false)}>
          <View className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <Text className={styles.modalTitle}>选择认定类型</Text>
            <View className={styles.typeList}>
              {recognitionTypes.map(type => (
                <View
                  key={type.id}
                  className={classnames(
                    styles.typeItem,
                    selectedType.id === type.id && styles.typeItemActive
                  )}
                  onClick={() => handleSelectType(type)}
                >
                  <Text className={styles.typeName}>{type.name}</Text>
                  <Text className={styles.typeDesc}>{type.description}</Text>
                </View>
              ))}
            </View>
            <Button className={styles.modalCloseBtn} onClick={() => setShowTypeModal(false)}>
              确定
            </Button>
          </View>
        </View>
      )}

      {showRegionModal && (
        <View className={styles.typeSelectorModal} onClick={() => setShowRegionModal(false)}>
          <View className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <Text className={styles.modalTitle}>选择申请地区</Text>
            <View className={styles.typeList}>
              {regionPolicies.map(region => (
                <View
                  key={region.id}
                  className={classnames(
                    styles.typeItem,
                    selectedRegion.id === region.id && styles.typeItemActive
                  )}
                  onClick={() => handleSelectRegion(region)}
                >
                  <Text className={styles.typeName}>{region.name}</Text>
                  <Text className={styles.typeDesc}>{region.highlights[0]}</Text>
                </View>
              ))}
            </View>
            <Button className={styles.modalCloseBtn} onClick={() => setShowRegionModal(false)}>
              确定
            </Button>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default SelfCheckPage;
