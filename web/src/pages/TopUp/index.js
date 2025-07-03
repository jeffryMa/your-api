import React, { useEffect, useState, useRef } from 'react';
import { API, isMobile, showError, showInfo, showSuccess } from '../../helpers';
import {
  renderNumber,
  renderQuota,
  renderQuotaWithAmount,
} from '../../helpers/render';
import {
  Col,
  Layout,
  Row,
  Typography,
  Card,
  Button,
  Form,
  Divider,
  Space,
  Modal,
  Toast,
  RadioGroup,
  Radio,
  Input,
  Banner,
  Tag,
  Tabs,
  TabPane,
  List,
  Progress,
  Spin,
  Table
} from '@douyinfe/semi-ui';
import Title from '@douyinfe/semi-ui/lib/es/typography/title';
import Text from '@douyinfe/semi-ui/lib/es/typography/text';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  IconCreditCard, 
  IconGift, 
  IconTickCircle,
  IconHistory,
  IconArrowDown,
  IconArrowUp,
  IconInfoCircle,
  IconUserGroup,
  IconCopy
} from '@douyinfe/semi-icons';


const TopUp = () => {
  const { t } = useTranslation();
  const [redemptionCode, setRedemptionCode] = useState('');
  const [topUpCode, setTopUpCode] = useState('');
  const [topUpCount, setTopUpCount] = useState(5); // 默认选择5元
  const [minTopupCount, setMinTopUpCount] = useState(1);
  const [amount, setAmount] = useState(0.0);
  const [minTopUp, setMinTopUp] = useState(1);
  const [topUpLink, setTopUpLink] = useState('');
  const [enableOnlineTopUp, setEnableOnlineTopUp] = useState(false);
  const [user, setUser] = useState(null);
  const [userQuota, setUserQuota] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [payWay, setPayWay] = useState('');
  const [selectedAmount, setSelectedAmount] = useState('5'); // 默认选择5元
  const [customAmount, setCustomAmount] = useState('');
  const [discount, setDiscount] = useState(1); // 折扣，默认为1（无折扣）
  const [isLoading, setIsLoading] = useState(true);
  const [quotaRates, setQuotaRates] = useState({});
  const [amountType, setAmountType] = useState('fixed'); // 'fixed' 或 'custom'
  const customInputRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [invitationHistory, setInvitationHistory] = useState([]);
  const [invitationProgress, setInvitationProgress] = useState(null);
  
  // 定义金额选项，均匀分布在2行
  const amountOptions = [
    { value: 5, label: '5元' },
    { value: 10, label: '10元' },
    { value: 50, label: '50元' },
    { value: 100, label: '100元' },
    { value: 200, label: '200元' },
    { value: 500, label: '500元' },
    { value: 1000, label: '1000元' },
    { value: 2000, label: '2000元' },
  ];

  // Placeholder data for new sections
  // const accountOverviewData = {
  //   monthlyUsage: 123456,
  //   totalUsage: 9876543,
  // };

  const recentActivities = [
    { type: '消费', model: 'GPT-4o', amount: 1200, time: '刚刚', success: true },
    { type: '充值', model: '支付宝', amount: 5000000, time: '1小时前', success: true },
    { type: '兑换', model: '', amount: 1000000, time: '3天前', success: true },
    { type: '消费', model: 'Midjourney', amount: 5000, time: '5天前', success: false },
  ]

  // 计算折扣
  const calculateDiscount = (value) => {
    const numValue = Number(value);
    if (numValue >= 10 && numValue <= 98) return 0.99;
    if (numValue >= 99 && numValue <= 198) return 0.98;
    if (numValue >= 199 && numValue <= 498) return 0.97;
    if (numValue >= 499 && numValue <= 998) return 0.96;
    if (numValue >= 999 && numValue <= 1998) return 0.95;
    if (numValue >= 1999) return 0.94;
    return 1;
  };



  // 只展示后端返回的实付金额和折扣信息（下方和弹窗用）
  const renderFinalAmount = (finalAmount, discount) => {
    if (discount < 1) {
      return `${finalAmount.toFixed(2)} ${t('元')} (${(discount * 100).toFixed(0)}${t('折')})`;
    }
    return `${finalAmount.toFixed(2)} ${t('元')}`;
  };

  // 处理金额选择
  const handleAmountChange = async (value) => {
    setAmountType('fixed');
    const numValue = Number(value);
    setTopUpCount(numValue);
    setSelectedAmount(value);
    setCustomAmount(numValue.toString());
    const newDiscount = calculateDiscount(numValue);
    setDiscount(newDiscount);
    await getAmount(numValue);
  };

  // 处理自定义金额输入
  const handleCustomAmountChange = async (value) => {
    setCustomAmount(value);
    if (value && Number(value) > 0) {
      const numValue = Number(value);
      setTopUpCount(numValue);
      const newDiscount = calculateDiscount(numValue);
      setDiscount(newDiscount);
      await getAmount(numValue);
    }
  };

  // 切换到自定义金额
  const switchToCustomAmount = () => {
    setAmountType('custom');
    setSelectedAmount('custom');
    if (customAmount && Number(customAmount) > 0) {
      setTopUpCount(Number(customAmount));
      getAmount(Number(customAmount));
    }
    setTimeout(() => {
      if (customInputRef.current) {
        customInputRef.current.focus();
      }
    }, 100);
  };

  const topUp = async () => {
    if (redemptionCode === '') {
      showInfo(t('请输入兑换码！'));
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await API.post('/api/user/topup', {
        key: redemptionCode,
      });
      const { success, message, data } = res.data;
      if (success) {
        showSuccess(t('兑换成功！'));
        Modal.success({
          title: t('兑换成功！'),
          content: t('成功兑换额度：') + renderQuota(data),
          centered: true,
        });
        setUserQuota((quota) => {
          return quota + data;
        });
        setRedemptionCode('');
      } else {
        showError(message);
      }
    } catch (err) {
      showError(t('请求失败'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openTopUpLink = () => {
    if (!topUpLink) {
      showError(t('超级管理员未设置充值链接！'));
      return;
    }
    window.open(topUpLink, '_blank');
  };

  const preTopUp = async (payment) => {
    if (!enableOnlineTopUp) {
      showError(t('管理员未开启在线充值！'));
      return;
    }
    if (topUpCount < minTopUp) {
      showError(t('充值数量不能小于') + minTopUp);
      return;
    }
    setPayWay(payment);
    setOpen(true);
  };

  const onlineTopUp = async () => {
    if (amount === 0) {
      await getAmount();
    }
    if (topUpCount < minTopUp) {
      showError('充值数量不能小于' + minTopUp);
      return;
    }
    setOpen(false);
    try {
      // 后端统一计算支付金额，前端只传递原始充值金额
      const res = await API.post('/api/user/pay', {
        amount: parseInt(topUpCount), // 原始充值金额
        top_up_code: topUpCode,
        payment_method: payWay,
      });
      if (res !== undefined) {
        const { message, data } = res.data;
        if (message === 'success') {
          let params = data;
          let url = res.data.url;
          let form = document.createElement('form');
          form.action = url;
          form.method = 'POST';
          let isSafari =
            navigator.userAgent.indexOf('Safari') > -1 &&
            navigator.userAgent.indexOf('Chrome') < 1;
          if (!isSafari) {
            form.target = '_blank';
          }
          for (let key in params) {
            let input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = params[key];
            form.appendChild(input);
          }
          document.body.appendChild(form);
          form.submit();
          document.body.removeChild(form);
        } else {
          showError(data);
        }
      } else {
        showError(res);
      }
    } catch (err) {
      console.log(err);
    } finally {
    }
  };

  const getUserQuota = async () => {
    let res = await API.get(`/api/user/self`);
    const { success, message, data } = res.data;
    if (success) {
      setUser(data);
      setUserQuota(data.quota);
    } else {
      showError(message);
    }
  };

  const getQuotaRates = () => {
    const rates = {};
    amountOptions.forEach(option => {
      rates[option.value] = option.value * 500000;
    });
    setQuotaRates(rates);
  };

  useEffect(() => {
    let status = localStorage.getItem('status');
    if (status) {
      status = JSON.parse(status);
      if (status.top_up_link) {
        setTopUpLink(status.top_up_link);
      }
      if (status.min_topup) {
        setMinTopUp(status.min_topup);
      }
      if (status.enable_online_topup) {
        setEnableOnlineTopUp(status.enable_online_topup);
      }
    }
    getUserQuota().then();
    getQuotaRates();
    getAmount(5).then(() => {
      setIsLoading(false);
    });
    fetchInvitationProgress();
  }, []);



  const calculateSavings = () => {
    if (discount < 1) {
      return (topUpCount - (topUpCount * discount)).toFixed(2);
    }
    return 0;
  };

  const estimateQuota = (value) => {
    return quotaRates[value] || Math.round(value * 500000);
  };

  const getAmount = async (value) => {
    if (value === undefined) {
      value = topUpCount;
    }
    try {
      const res = await API.post('/api/user/amount', {
        amount: parseFloat(value),
        top_up_code: topUpCode,
      });
      if (res !== undefined) {
        const { message, data } = res.data;
        if (message === 'success') {
          setAmount(parseFloat(data));
        } else {
          setAmount(0);
          Toast.error({ content: '错误：' + data, id: 'getAmount' });
        }
      } else {
        showError(res);
      }
    } catch (err) {
      console.log(err);
    } finally {
    }
  };

  const handleCancel = () => {
    setOpen(false);
  };

  const fetchInvitationHistory = async () => {
    setModalLoading(true);
    try {
      const res = await API.get('/api/user/invitation-history');
      const { success, data } = res.data;
      if (success) {
        setInvitationHistory(data || []);
      } else {
        showError('无法加载邀请记录');
      }
    } catch (error) {
      showError('加载邀请记录时发生错误');
    } finally {
      setModalLoading(false);
    }
  };

  const fetchInvitationProgress = async () => {
    try {
      const res = await API.get('/api/user/invitation-progress');
      const { success, data } = res.data;
      if (success) {
        setInvitationProgress(data);
      } else {
        showError('无法加载邀请进度');
      }
    } catch (error) {
      showError('加载邀请进度时发生错误');
    }
  };

  const showInvitationModal = () => {
    setIsModalOpen(true);
    fetchInvitationHistory();
  };

  const getDiscountText = (discountValue) => {
    if (discountValue === 1) return null;
    return `${(discountValue * 100).toFixed(0)}折`;
  };

  const renderAmountCard = (option) => {
    const value = option.value;
    const isSelected = amountType === 'fixed' && selectedAmount === value.toString();
    const discountValue = calculateDiscount(value);
    const discountText = getDiscountText(discountValue);
    const estimatedQuota = estimateQuota(value);
    
    return (
      <div 
        onClick={() => handleAmountChange(value.toString())}
        style={{
          width: '100%',
          padding: '16px',
          border: isSelected ? '2px solid #0077fa' : '1px solid #e0e0e0',
          borderRadius: '12px',
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: isSelected ? 'rgba(0, 119, 250, 0.05)' : '#fff',
          boxShadow: isSelected ? '0 4px 12px rgba(0, 119, 250, 0.15)' : 'none',
          transition: 'all 0.3s ease',
          position: 'relative',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}
      >
        {discountText && (
          <div style={{
            position: 'absolute',
            top: '-10px',
            right: '-10px',
            backgroundColor: '#ff4d4f',
            color: 'white',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '14px',
            boxShadow: '0 2px 6px rgba(255, 77, 79, 0.3)'
          }}>
            {discountText}
          </div>
        )}
        
        <div style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
          {value} {t('元')}
        </div>
        
        {discountValue < 1 ? (
          <>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
              <span style={{ textDecoration: 'line-through' }}>原价: {value} {t('元')}</span>
            </div>
            <div style={{ fontSize: '14px', color: '#ff4d4f', fontWeight: 'bold' }}>
              实付: {(value * discountValue).toFixed(2)} {t('元')}
            </div>
            <div style={{ fontSize: '12px', color: '#52c41a', marginTop: '4px' }}>
              立省: {(value - (value * discountValue)).toFixed(2)} {t('元')}
            </div>
            <Divider style={{ margin: '8px 0' }} />
            <div style={{ fontSize: '12px', color: '#0077fa' }}>
              到账额度: ~{renderQuota(estimatedQuota)}
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
              实付: {value} {t('元')}
            </div>
            <Divider style={{ margin: '8px 0' }} />
            <div style={{ fontSize: '12px', color: '#0077fa' }}>
              到账额度: ~{renderQuota(estimatedQuota)}
            </div>
          </>
        )}
        
        {isSelected && (
          <div style={{ position: 'absolute', bottom: '8px', right: '8px', color: '#0077fa' }}>
            <IconTickCircle />
          </div>
        )}
      </div>
    );
  };

  const renderDiscountInfo = () => {
    if (discount === 1) {
      return null;
    }
    
    return (
      <div style={{ marginBottom: '16px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          background: 'linear-gradient(45deg, #ff4d4f, #ff7875)',
          color: 'white',
          padding: '6px 12px',
          borderRadius: '20px',
          boxShadow: '0 4px 12px rgba(255, 77, 79, 0.3)',
          fontWeight: 'bold',
          fontSize: '16px'
        }}>
          <IconGift style={{ marginRight: '8px' }} />
          当前享受 <span style={{ 
            fontSize: '20px', 
            margin: '0 4px',
            textShadow: '1px 1px 2px rgba(0,0,0,0.2)'
          }}>{(discount * 100).toFixed(0)}折</span> 优惠
        </div>
      </div>
    );
  };

  const renderMyWallet = () => (
    <Card style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
        <IconCreditCard size="large" style={{ marginRight: '12px', color: '#0077fa' }} />
        <Title heading={4} style={{ margin: 0 }}>{t('我的钱包')}</Title>
      </div>
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <Text type='tertiary'>当前剩余额度</Text>
        <Title heading={1} style={{ margin: '8px 0' }}>
          {renderQuota(userQuota)}
        </Title>
      </div>
      <Row style={{ marginBottom: '20px' }} gutter={24}>
        <Col span={12} style={{ textAlign: 'center' }}>
          <Text type='tertiary'>本月消费</Text>
          <div style={{ fontSize: '16px', fontWeight: '500' }}>
            {renderQuota(user ? user.used_quota_this_month : 0)}
          </div>
        </Col>
        <Col span={12} style={{ textAlign: 'center', borderLeft: '1px solid #e0e0e0' }}>
          <Text type='tertiary'>累计消费</Text>
          <div style={{ fontSize: '16px', fontWeight: '500' }}>
            {renderQuota(user ? user.used_quota : 0)}
          </div>
        </Col>
      </Row>
      <Divider />
       <Form>
          <Form.Input
            field={'redemptionCode'}
            label={t('兑换码')}
            placeholder={t('请输入兑换码')}
            name='redemptionCode'
            value={redemptionCode}
            onChange={(value) => {
              setRedemptionCode(value);
            }}
          />
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            {topUpLink && (
              <Button
                type={'primary'}
                theme={'light'}
                onClick={openTopUpLink}
                icon={<IconCreditCard />}
                style={{ flex: 1 }}
              >
                {t('购买兑换码')}
              </Button>
            )}
            <Button
              type={'primary'}
              onClick={topUp}
              disabled={isSubmitting}
              icon={<IconGift />}
              style={{ flex: 1 }}
            >
              {isSubmitting ? t('兑换中...') : t('立即兑换')}
            </Button>
          </div>
        </Form>
    </Card>
  );

  const renderInviteCard = () => {
    const cardStyle = {
      backgroundColor: 'var(--semi-color-primary-light-default)',
      borderRadius: '12px',
      padding: '2rem',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      border: '1px solid var(--semi-color-border)'
    };

    const tableHeaderStyle = {
      backgroundColor: '#f8f9fa',
      padding: '8px 12px',
      fontWeight: '600',
      color: '#495057',
      borderTopLeftRadius: '8px',
      borderTopRightRadius: '8px'
    };
    
    const tableRowStyle = {
      padding: '12px',
      borderBottom: '1px solid #dee2e6',
      textAlign: 'center'
    };

    const titleStyle = {
      fontSize: '24px',
      fontWeight: 'bold',
      color: 'var(--semi-color-text-0)',
      marginBottom: '1rem',
    };
    
    const textStyle = {
      fontSize: '16px',
      color: 'var(--semi-color-text-1)',
      lineHeight: '1.8',
    };

    if (!user) {
      return (
        <Card style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100px' }}>
            <Spin size="large" />
            <Text style={{ marginLeft: '1rem', fontSize: '18px' }}>加载邀请信息中...</Text>
          </div>
        </Card>
      );
    }

    const referralLink = `${window.location.origin}/register?aff=${user.aff_code}`;
    
    const copyLink = () => {
      if (referralLink) {
        // 先尝试 clipboard API
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(referralLink).then(() => {
            showSuccess('邀请链接已复制到剪贴板');
          }, () => {
            fallbackCopyTextToClipboard(referralLink);
          });
        } else {
          fallbackCopyTextToClipboard(referralLink);
        }
      }
    };

    function fallbackCopyTextToClipboard(text) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.top = 0;
      textArea.style.left = 0;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        showSuccess('邀请链接已复制到剪贴板');
      } catch (err) {
        showError('复制失败，请手动复制');
      }
      document.body.removeChild(textArea);
    }

    const currentInvites = invitationProgress ? invitationProgress.current_invites : (user ? user.aff_count || 0 : 0);
    const progressPercent = invitationProgress ? invitationProgress.progress_percent : 0;
    const rewardTiers = invitationProgress ? invitationProgress.reward_tiers : [
      { threshold: 1, youGet: '3元兑换券', friendGets: '3元兑换券' },
      { threshold: 5, youGet: '5元兑换券', friendGets: '5元兑换券' },
      { threshold: 10, youGet: '<strong>10元兑换券</strong>', friendGets: '<strong>8元兑换券</strong>' },
    ];

    let nextTier = invitationProgress ? invitationProgress.next_tier : null;
    let currentTier = invitationProgress ? invitationProgress.current_tier : null;
    
    // 根据后台数据生成进度标签
    let progressLabel = `${currentInvites} 人`;
    if (nextTier) {
      progressLabel = `${currentInvites} / ${nextTier.threshold} 人`;
    } else if (currentInvites > 0) {
      progressLabel = `${currentInvites} 人，太棒了！`;
    }

    return (
      <Card style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
          <IconUserGroup size='extra-large' style={{ marginRight: '1rem', color: 'var(--semi-color-primary)' }}/>
          <Title heading={3} style={titleStyle}>邀请好友，同享优惠</Title>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <Progress 
            percent={progressPercent} 
            stroke={{
              '0%': 'var(--semi-color-primary-light-default)',
              '100%': 'var(--semi-color-primary)',
            }}
            aria-label="邀请进度"
            showInfo={true}
            format={() => progressLabel}
            style={{ height: '24px' }}
          />
        </div>

        <Text style={textStyle}>
          每成功邀请一位好友，您都能向着更丰厚的奖励迈进！您的好友也将获得专属注册好礼。立即分享，同享优惠！
        </Text>

        <div style={{ border: '1px solid #dee2e6', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px' }}>
          <div style={{ display: 'flex', textAlign: 'center', ...tableHeaderStyle }}>
            <div style={{ flex: 1 }}>邀请达标人数</div>
            <div style={{ flex: 1 }}>您获得的奖励</div>
            <div style={{ flex: 1 }}>好友获得的奖励</div>
          </div>
          <div>
            {rewardTiers.map((row, index) => {
              const isCurrent = currentTier && row.threshold === currentTier.threshold;
              const rowStyle = {
                display: 'flex',
                ...tableRowStyle,
                ...(isCurrent && { 
                  backgroundColor: 'var(--semi-color-primary-light-active)', 
                  fontWeight: 'bold',
                  color: 'var(--semi-color-primary)',
                 }),
              };

              return (
                <div key={index} style={rowStyle}>
                  <div style={{ flex: 1 }} dangerouslySetInnerHTML={{ __html: `≥ <strong>${row.threshold}人</strong>` }}></div>
                  <div style={{ flex: 1 }} dangerouslySetInnerHTML={{ __html: row.youGet }}></div>
                  <div style={{ flex: 1 }} dangerouslySetInnerHTML={{ __html: row.friendGets }}></div>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          padding: '12px',
          backgroundColor: '#f4f6f8',
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          <Text style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexGrow: 1 }}>{referralLink}</Text>
          <Button
            theme="light"
            icon={<IconCopy />}
            onClick={copyLink}
          >
            复制
          </Button>
        </div>
        <Button type="primary" style={{ width: '100%' }} onClick={showInvitationModal}>查看我的邀请记录</Button>
      </Card>
    );
  };

  const renderHistoryModal = () => {
    const columns = [
      {
        title: '用户名',
        dataIndex: 'username',
      },
      {
        title: '昵称',
        dataIndex: 'display_name',
      },
      {
        title: '注册时间',
        dataIndex: 'created_at',
        render: (timestamp) => {
          // 检查时间戳是否有效
          if (!timestamp) return '未知';
          // 转换为毫秒
          const date = new Date(timestamp * 1000);
          // 检查日期是否有效（不是1970年）
          if (date.getFullYear() <= 1970) return '未知';
          return date.toLocaleString();
        },
      },
    ];

    return (
      <Modal
        title="我的邀请记录"
        visible={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={600}
      >
        <Spin spinning={modalLoading}>
          <Table columns={columns} dataSource={invitationHistory} pagination={false} />
        </Spin>
      </Modal>
    );
  };

  return (
    <div style={{ backgroundColor: '#f4f6f8', minHeight: 'calc(100vh - 60px)' }}>
      <Layout style={{ padding: '24px', backgroundColor: 'transparent' }}>
        <Layout.Content>
          <Modal
            title={t('确定要充值吗')}
            visible={open}
            onOk={onlineTopUp}
            onCancel={handleCancel}
            maskClosable={false}
            size={'small'}
            centered={true}
          >
            <p>
              {t('充值数量')}：{topUpCount}
            </p>
            <p>
              {t('实付金额')}：{renderFinalAmount(topUpCount * discount, discount)}
            </p>
            <p>{t('是否确认充值？')}</p>
          </Modal>
          {renderHistoryModal()}
          
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={8}>
              {renderMyWallet()}
              {renderInviteCard()}
            </Col>
            
            <Col xs={24} lg={16}>
              <Card style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', height: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                  <IconCreditCard size="large" style={{ marginRight: '12px', color: '#0077fa' }} />
                  <Title heading={4} style={{ margin: 0 }}>{t('在线充值')}</Title>
                </div>
                <Form style={{ height: 'calc(100% - 50px)', display: 'flex', flexDirection: 'column' }}>
                  <Tabs 
                    type="line" 
                    activeKey={amountType} 
                    onChange={key => {
                      if (key === 'custom') {
                        switchToCustomAmount();
                      } else {
                        setAmountType('fixed');
                        if (selectedAmount !== 'custom') {
                          handleAmountChange(selectedAmount);
                        } else {
                          handleAmountChange('5');
                        }
                      }
                    }}
                    style={{ marginBottom: '16px' }}
                  >
                    <TabPane tab={t('固定金额')} itemKey="fixed">
                      <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
                        {amountOptions.slice(0, 4).map((option, index) => (
                          <Col xs={12} sm={12} md={6} key={index}>
                            {renderAmountCard(option)}
                          </Col>
                        ))}
                      </Row>
                      
                      <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
                        {amountOptions.slice(4).map((option, index) => (
                          <Col xs={12} sm={12} md={6} key={index + 4}>
                            {renderAmountCard(option)}
                          </Col>
                        ))}
                      </Row>
                    </TabPane>
                    <TabPane tab={t('自定义金额')} itemKey="custom">
                      <div style={{ marginTop: '16px' }}>
                        <Form.Input
                          field="customAmount"
                          label={t('输入充值金额')}
                          placeholder={t('请输入自定义金额')}
                          value={customAmount}
                          onChange={handleCustomAmountChange}
                          type="number"
                          min={minTopUp}
                          style={{ width: '100%' }}
                          size="large"
                          ref={customInputRef}
                          autoFocus
                        />
                      </div>
                    </TabPane>
                  </Tabs>
                  
                  <div style={{ marginTop: 'auto' }}>
                    {renderDiscountInfo()}
                    
                    <div style={{ 
                      padding: '16px', 
                      backgroundColor: 'rgba(0, 119, 250, 0.05)', 
                      borderRadius: '12px',
                      marginBottom: '16px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span>{t('充值金额')}:</span>
                        <span>{topUpCount} {t('元')}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{t('实付金额')}:</span>
                        <span style={{ fontWeight: 'bold', fontSize: '18px', color: '#ff4d4f' }}>
                          {isLoading ? '计算中...' : renderFinalAmount(topUpCount * discount, discount)}
                        </span>
                      </div>
                      {discount < 1 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                          <span>{t('立省金额')}:</span>
                          <span style={{ fontWeight: 'bold', color: '#52c41a' }}>
                            {calculateSavings()} {t('元')}
                          </span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                        <span>{t('预计到账额度')}:</span>
                        <span style={{ fontWeight: 'bold', color: '#0077fa' }}>
                          {amountType === 'custom' ? 
                            renderQuota(Math.round(topUpCount * 500000)) : 
                            renderQuota(estimateQuota(Number(selectedAmount)))}
                        </span>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <Button
                        type="primary"
                        theme="light"
                        onClick={() => preTopUp('zfb')}
                        style={{ 
                          flex: 1,
                          height: '48px',
                          fontSize: '16px',
                          fontWeight: '600',
                          backgroundColor: '#E6F7FF',
                          color: '#0077FF',
                          border: '1px solid #B3D9FF'
                        }}
                        disabled={!enableOnlineTopUp || topUpCount < minTopUp || isLoading}
                        size="large"
                        icon={<IconCreditCard />}
                      >
                        {t('支付宝支付')}
                      </Button>
                      {/* 微信支付按钮暂时注释
                      <Button
                        type="primary"
                        theme="light"
                        onClick={() => preTopUp('wx')}
                        style={{
                          flex: 1,
                          height: '48px',
                          fontSize: '16px',
                          fontWeight: '600',
                          backgroundColor: '#F6FFED',
                          color: '#52C41A',
                          border: '1px solid #B7EB8F'
                        }}
                        disabled={!enableOnlineTopUp || topUpCount < minTopUp || isLoading}
                        size="large"
                        icon={<IconCreditCard />}
                      >
                        {t('微信支付')}
                      </Button>
                      */}
                    </div>
                  </div>
                </Form>
              </Card>
            </Col>
          </Row>
        </Layout.Content>
      </Layout>
    </div>
  );
};

export default TopUp;
