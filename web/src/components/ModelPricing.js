import React, { useContext, useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { API, copy, showError, showInfo, showSuccess } from '../helpers';
import { useTranslation } from 'react-i18next';
import { SparklesIcon, FaceSmileIcon } from '@heroicons/react/24/solid';
// 新增CSS样式定义
const tableStyles = `
  .responsive-table .semi-table-row {
    transition: all 0.2s ease-in-out;
  }
  
  .responsive-table .semi-table-row:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
  
  .responsive-table .semi-table-thead .semi-table-row:hover {
    transform: none;
    box-shadow: none;
  }
  
  @media (max-width: 768px) {
    /* 强制表格容器不可滚动 */
    .mobile-table-container {
      overflow-x: hidden !important;
      max-width: 100% !important;
    }
    
    /* 强制表格宽度适应容器 */
    .responsive-table {
      width: 100% !important;
      overflow: hidden !important;
    }
    
    /* 表格内容区域强制不滚动 */
    .responsive-table .semi-table-body {
      overflow-x: hidden !important;
      width: 100% !important;
    }
    
    /* 表格行强制换行 */
    .responsive-table .semi-table-tbody .semi-table-row {
      display: flex !important;
      flex-direction: column !important;
      border-bottom: 1px solid rgba(var(--semi-grey-1), 1);
      padding: 8px 0;
      margin-bottom: 12px;
      border-radius: 8px;
      background-color: white !important;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      width: 100% !important;
      max-width: 100% !important;
    }
    
    /* 单元格强制不换行，占满整行 */
    .responsive-table .semi-table-tbody .semi-table-row .semi-table-cell {
      display: flex !important;
      flex-wrap: wrap !important;
      padding: 8px 12px;
      border: none;
      width: 100% !important;
      max-width: 100% !important;
      box-sizing: border-box;
      align-items: center;
      min-width: 0 !important;
    }
    
    .responsive-table .semi-table-tbody .semi-table-row .semi-table-cell::before {
      content: attr(data-column);
      font-weight: 600;
      color: var(--semi-color-text-2);
      width: 90px;
      min-width: 90px;
      flex-shrink: 0;
    }
    
    /* 隐藏表头 */
    .responsive-table .semi-table-header {
      display: none !important;
    }
    
    /* 移动端不需要左右阴影指示器 */
    .scroll-indicator {
      display: none !important;
    }
    
    /* 优化移动端卡片外观 */
    .responsive-table .semi-table-tbody .semi-table-row {
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.05);
      overflow: hidden;
      transition: all 0.3s;
    }
    
    /* 移动端的选择框位置调整 */
    .responsive-table .semi-table-tbody .semi-table-row .semi-table-row-cell:first-child {
      position: absolute;
      right: 10px;
      top: 10px;
      background: rgba(255,255,255,0.9);
      border-radius: 50%;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2;
    }
    
    /* 移动端优化表格分页器 */
    .responsive-table .semi-table-pagination {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
    
    /* 强制所有单元格适应宽度，无视min-width设置 */
    .responsive-table .semi-table-tbody .semi-table-row .semi-table-cell > div {
      max-width: 100% !important;
      width: 100% !important;
      min-width: 0 !important;
    }
    
    /* 模型名称在移动端特别处理，让它显示更突出 */
    .responsive-table .semi-table-tbody .semi-table-row .semi-table-cell[data-column="模型名称"] {
      background-color: rgba(var(--semi-grey-0), 1);
      border-radius: 4px 4px 0 0;
      margin-top: -8px;
      padding-top: 16px;
      font-weight: bold;
    }
    
    /* 模型价格在移动端底部显示，更明显 */
    .responsive-table .semi-table-tbody .semi-table-row .semi-table-cell[data-column="模型价格"] {
      background-color: rgba(var(--semi-blue-0), 0.2);
      border-radius: 0 0 4px 4px;
      margin-bottom: -8px;
      padding-bottom: 16px;
    }
    
    /* 确保表格内所有元素不产生水平滚动 */
    .responsive-table, 
    .responsive-table * {
      max-width: 100vw !important;
      overflow-x: hidden !important;
    }
    
    /* 去除semi-ui默认的水平滚动 */
    .responsive-table .semi-table-wrapper,
    .responsive-table .semi-table-container,
    .responsive-table .semi-table-body {
      overflow-x: hidden !important;
    }
  }
`;

import {
  Banner,
  Input,
  Layout,
  Modal,
  Space,
  Table,
  Tag,
  Tooltip,
  Popover,
  ImagePreview,
  Button,
  Card,
  Select,
  Avatar,
} from '@douyinfe/semi-ui';
import {
  IconStar,
  IconTerminal,
  IconMore,
  IconVerify,
  IconClose,
  IconUploadError,
  IconHelpCircle,
  IconFilter,
  IconChevronLeft,
  IconChevronRight,
} from '@douyinfe/semi-icons';
import { UserContext } from '../context/User/index.js';
import Text from '@douyinfe/semi-ui/lib/es/typography/text';
import '../pages/Home/HomeStyles.css';
import {useDispatch, useSelector} from "react-redux";
import {fetchModelDiscriptions, fetchProviders} from "../store/setting/providers.js";
import ApiGuideDrawer from "./ApiGuideDrawer.js";

// 定义一些实用类
const styles = {
  mb4: {
    marginBottom: '1rem'
  },
  priceValue: {
    color: 'var(--semi-color-text-0)',
    fontWeight: 600
  }
};

const ModelPricing = ({onInitialize}) => {
  const { t } = useTranslation();
  
  // 创建含有翻译的样式
  const getMobileStyles = () => `
    /* 模型名称在移动端特别处理，让它显示更突出 */
    .responsive-table .semi-table-tbody .semi-table-row .semi-table-cell[data-column="${t('模型名称')}"] {
      background-color: rgba(var(--semi-grey-0), 1);
      border-radius: 4px 4px 0 0;
      margin-top: -8px;
      padding-top: 16px;
      font-weight: bold;
    }
    
    /* 模型价格在移动端底部显示，更明显 */
    .responsive-table .semi-table-tbody .semi-table-row .semi-table-cell[data-column="${t('模型价格')}"] {
      background-color: rgba(var(--semi-blue-0), 0.2);
      border-radius: 0 0 4px 4px;
      margin-bottom: -8px;
      padding-bottom: 16px;
    }
  `;
  
  const [filteredValue, setFilteredValue] = useState([]);
  const compositionRef = useRef({ isComposition: false });
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [modalImageUrl, setModalImageUrl] = useState('');
  const [isModalOpenurl, setIsModalOpenurl] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState('default');
  const [selectedProvider, setSelectedProvider] = useState('全部');
  const [groupOptions, setGroupOptions] = useState([]);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userState, userDispatch] = useContext(UserContext);
  const [groupRatio, setGroupRatio] = useState({});
  const [usableGroup, setUsableGroup] = useState({});
  const [showRatioColumn, setShowRatioColumn] = useState(false);
  const [showOnlySelectedGroup, setShowOnlySelectedGroup] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [activePage, setActivePage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [apiDrawerVisible, setApiDrawerVisible] = useState(false);
  const [currencyType, setCurrencyType] = useState('CNY');

  // 检测是否为移动设备
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // 初始检测
    checkIfMobile();
    
    // 监听窗口大小变化
    window.addEventListener('resize', checkIfMobile);
    
    // 清理监听器
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // 在 ModelPricing.js 中修改 useEffect 钩子
  useEffect(() => {
    if (onInitialize) {
      onInitialize({
        setSelectedProvider: (providerName) => {
          setSelectedProvider(providerName);
          setActivePage(1); // 重置页码为第一页

          // 添加滚动逻辑
          setTimeout(() => {
            if (providerScrollRef.current) {
              const providerItems = providerScrollRef.current.querySelectorAll('.provider-item');
              for (let i = 0; i < providerItems.length; i++) {
                if (providerItems[i].textContent.includes(providerName)) {
                  const containerWidth = providerScrollRef.current.clientWidth;
                  const elementOffset = providerItems[i].offsetLeft;
                  providerScrollRef.current.scrollTo({
                    left: elementOffset - containerWidth / 2 + providerItems[i].offsetWidth / 2,
                    behavior: 'smooth'
                  });
                  break;
                }
              }
            }
          }, 100);
        }
      });
    }
  }, [onInitialize]);

  // AI供应商数据
  const dispatch = useDispatch();
  const { providers = [],priceRatio=0} = useSelector((state) => state.providers);



  useEffect(() => {
    if (providers.length === 0) {
      dispatch(fetchProviders());
      // dispatch(fetchModelDiscriptions());
    }
  }, [dispatch]);

  // 根据模型名称判断供应商
  const getProviderFromModelName = useCallback((modelId) => {
    modelId = modelId.toLowerCase();
     // 遍历providers
    for (let i = 0; i < providers.length; i++) {
        const provider = providers[i];
        if (modelId.includes(provider.id.toLowerCase())) {
              return provider.id;
          }
          // 判断provider.includes是否非空，并且是否包含
          if (provider.includes && provider.includes.some((item) => modelId.includes(item.toLowerCase()))) {
              return provider.id;
          }
    }
    return '其他';
  }, [providers]);

  // 供应商导航栏滚动功能
  const providerScrollRef = useRef(null);
  const [showLeftScroll, setShowLeftScroll] = useState(true);
  const [showRightScroll, setShowRightScroll] = useState(true);

  
  // 滚动处理函数
  const handleScroll = useCallback((direction) => {
    if (providerScrollRef.current) {
      const scrollAmount = 300; // 每次滚动的像素量
      const currentScroll = providerScrollRef.current.scrollLeft;
      providerScrollRef.current.scrollTo({
        left: direction === 'left' ? currentScroll - scrollAmount : currentScroll + scrollAmount,
        behavior: 'smooth'
      });

    }
  }, []);

  // 将copyText函数移到这里，在columns之前定义
  const copyText = useCallback(async (text) => {
    if (await copy(text)) {
      showSuccess('已复制：' + text);
    } else {
      // setSearchKeyword(text);
      Modal.error({ title: '无法复制到剪贴板，请手动复制', content: text });
    }
  }, []);

  // 过滤显示的模型
  const filteredModels = useMemo(() => {
    if (!models || models.length === 0) return [];

    return models.filter(model => {
      // 首先检查模型是否包含所选分组
      const hasSelectedGroup = model.enable_groups.includes(selectedGroup);

      // 如果不包含所选分组，直接过滤掉
      if (showOnlySelectedGroup && !hasSelectedGroup) return false;

      // 然后检查是否匹配供应商筛选条件
      if (selectedProvider !== '全部') {
        const provider = getProviderFromModelName(model.model_name);
        
        // 如果选择了"其他"供应商，则显示所有不属于已定义供应商的模型
        if (selectedProvider === '其他') {
          return provider === '其他';
        }
        
        // 否则显示匹配选定供应商的模型
        return provider === selectedProvider;
      }

      // 如果是全部供应商且包含所选分组，则显示
      return true;
    });
  }, [models, selectedProvider, selectedGroup, showOnlySelectedGroup, getProviderFromModelName]);

  // 计算每个供应商的模型数量
  const providerCounts = useMemo(() => {
    if (!models || models.length === 0) return {};
    
    // 首先过滤掉不包含当前所选分组的模型
    const modelsInSelectedGroup = models.filter(model => {
      // 首先检查模型是否包含所选分组
      const hasSelectedGroup = model.enable_groups.includes(selectedGroup);

      // 如果不包含所选分组，直接过滤掉
      if (showOnlySelectedGroup && !hasSelectedGroup) return false;

      return true;
    });
    
    const counts = { '全部': modelsInSelectedGroup.length };
    modelsInSelectedGroup.forEach(model => {
      const provider = getProviderFromModelName(model.model_name);
      counts[provider] = (counts[provider] || 0) + 1;
    });
    
    return counts;
  }, [models, selectedGroup, showOnlySelectedGroup, getProviderFromModelName]);

  const rowSelection = useMemo(
      () => ({
          onChange: (selectedRowKeys, selectedRows) => {
            setSelectedRowKeys(selectedRowKeys);
          },
      }),
      []
  );

  const handleChange = (value) => {
    if (compositionRef.current.isComposition) {
      return;
    }
    const newFilteredValue = value ? [value] : [];
    setFilteredValue(newFilteredValue);
    setActivePage(1); // 重置页码为第一页
  };
  const handleCompositionStart = () => {
    compositionRef.current.isComposition = true;
  };

  const handleCompositionEnd = (event) => {
    compositionRef.current.isComposition = false;
    const value = event.target.value;
    const newFilteredValue = value ? [value] : [];
    setFilteredValue(newFilteredValue);
    setActivePage(1); // 重置页码为第一页
  };

  function renderQuotaType(type) {
    switch (type) {
      case 1:
        return (
            <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium shadow-sm"
                 style={{
                   background: 'linear-gradient(to right, var(--semi-color-tertiary-light-default), var(--semi-color-tertiary-light-hover))',
                   color: 'var(--semi-color-tertiary)',
                   borderColor: 'var(--semi-color-tertiary-light-active)',
                   borderWidth: '1px',
                   borderStyle: 'solid'
                 }}>
          <span className="flex items-center">
            <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4V20M18 12H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {t('按次计费')}
          </span>
            </div>
        );
      case 0:
        return (
            <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium shadow-sm"
                 style={{
                   background: 'linear-gradient(to right, var(--semi-color-primary-light-default), var(--semi-color-primary-light-hover))',
                   color: 'var(--semi-color-primary)',
                   borderColor: 'var(--semi-color-primary-light-active)',
                   borderWidth: '1px',
                   borderStyle: 'solid'
                 }}>
          <span className="flex items-center">
            <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {t('按量计费')}
          </span>
            </div>
        );
      default:
        return (
            <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium shadow-sm"
                 style={{
                   background: 'linear-gradient(to right, var(--semi-color-fill-0), var(--semi-color-fill-1))',
                   color: 'var(--semi-color-text-1)',
                   borderColor: 'var(--semi-color-border)',
                   borderWidth: '1px',
                   borderStyle: 'solid'
                 }}>
          <span className="flex items-center">
            <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {t('未知')}
          </span>
            </div>
        );
    }
  }

  function renderAvailable(available) {
    return (
        <Popover
            content={
              <div className="py-2 px-3">
                {available
                    ? t('当前分组可用')
                    : t('当前分组不可用')}
              </div>
            }
            position='top'
            style={{
              backgroundColor: 'var(--semi-color-bg-2)',
              borderColor: 'var(--semi-color-border)',
              color: 'var(--semi-color-text-0)',
              borderWidth: 1,
              borderStyle: 'solid',
            }}
        >
          {available ? (
              <div className="flex items-center justify-center py-1 px-2 rounded-md whitespace-nowrap"
                   style={{
                     backgroundColor: 'var(--semi-color-success-light-default)',
                     borderColor: 'var(--semi-color-success-light-active)',
                     borderWidth: '1px',
                     borderStyle: 'solid'
                   }}>
                <IconVerify size="small" style={{ color: 'var(--semi-color-success)' }} className="flex-shrink-0" />
                <span className="ml-1 text-xs font-medium"
                      style={{ color: 'var(--semi-color-success)' }}>
            {t('当前分组可用')}
          </span>
              </div>
          ) : (
              <div className="flex items-center justify-center py-1 px-2 rounded-md whitespace-nowrap"
                   style={{
                     backgroundColor: 'var(--semi-color-danger-light-default)',
                     borderColor: 'var(--semi-color-danger-light-active)',
                     borderWidth: '1px',
                     borderStyle: 'solid'
                   }}>
                <IconClose size="small" style={{ color: 'var(--semi-color-danger)' }} className="flex-shrink-0" />
                <span className="ml-1 text-xs font-medium"
                      style={{ color: 'var(--semi-color-danger)' }}>
            {t('当前分组不可用')}
          </span>
              </div>
          )}
        </Popover>
    );
  }

  const columns = useMemo(() => {
    const baseColumns = [
      {
        title: t('可用性'),
        dataIndex: 'available',
        render: (text, record, index) => {
          // 判断支持的分组有没有所选分组
          let available = false;
          if (record.enable_groups.includes(selectedGroup)) {
            available = true;
          }
          return renderAvailable(available);
        },
        sorter: (a, b) => a.available - b.available,
        className: 'min-w-[80px]',
        onCell: () => ({
          'data-column': t('可用性')
        }),
        width: '7%',
      },
      {
        title: t('模型名称'),
        dataIndex: 'model_name',
        render: (text, record, index) => {
          return (
              <>
                <div
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer whitespace-nowrap max-w-full overflow-hidden"
                    style={{
                      background: 'linear-gradient(to right, var(--semi-color-primary-light-default), var(--semi-color-primary-light-hover))',
                      color: 'var(--semi-color-primary)',
                      borderColor: 'var(--semi-color-primary-light-active)',
                      borderWidth: '1px',
                      borderStyle: 'solid'
                    }}
                    onClick={() => copyText(text)}
                    title={text}
                >
                  <span className="truncate">{text}</span>
                </div>
                </>
          );
        },
        onFilter: (value, record) =>
            record.model_name.toLowerCase().includes(value.toLowerCase()),
        filteredValue,
        className: 'min-w-[120px]',
        onCell: () => ({
          'data-column': t('模型名称')
        }),
        width: '13%',
      },
      {
        title: t('计费类型'),
        dataIndex: 'quota_type',
        render: (text, record, index) => {
          return renderQuotaType(parseInt(text));
        },
        sorter: (a, b) => a.quota_type - b.quota_type,
        className: 'min-w-[100px]',
        onCell: () => ({
          'data-column': t('计费类型')
        }),
        width: '10%',
      },
      {
        title: t('可用分组'),
        dataIndex: 'enable_groups',
        render: (text, record, index) => {
          // 根据索引选择变量颜色
          const getColorStyle = (idx) => {
            const colorVariables = [
              { bg: 'var(--semi-color-primary-light-default)', text: 'var(--semi-color-primary)' },
              { bg: 'var(--semi-color-success-light-default)', text: 'var(--semi-color-success)' },
              { bg: 'var(--semi-color-tertiary-light-default)', text: 'var(--semi-color-tertiary)' },
              { bg: 'var(--semi-color-danger-light-default)', text: 'var(--semi-color-danger)' },
              { bg: 'var(--semi-color-warning-light-default)', text: 'var(--semi-color-warning)' },
              { bg: 'var(--semi-color-info-light-default)', text: 'var(--semi-color-info)' }
            ];
            return colorVariables[idx % colorVariables.length];
          };

          return (
              <div className="flex flex-wrap gap-1.5">
                {text.map((group, idx) => {
                  if (usableGroup[group]) {
                    // 对每个分组使用不同颜色
                    const colorStyle = getColorStyle(idx);

                    if (group === selectedGroup) {
                      return (
                          <div 
                              key={group} 
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border"
                              style={{ 
                                backgroundColor: colorStyle.bg, 
                                color: colorStyle.text,
                                borderColor: colorStyle.text
                              }}
                          >
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            {group}
                          </div>
                      );
                    } else {
                      return (
                          <div
                              key={group}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity"
                              style={{ 
                                backgroundColor: colorStyle.bg, 
                                color: colorStyle.text
                              }}
                              onClick={() => {
                                setSelectedGroup(group);
                                showInfo(t('当前查看的分组为：{{group}}，倍率为：{{ratio}}', {
                                  group: group,
                                  ratio: groupRatio[group]
                                }));
                              }}
                          >
                            {group}
                          </div>
                      );
                    }
                  }
                  return null;
                })}
              </div>
          );
        },
        className: 'min-w-[150px]',
        onCell: () => ({
          'data-column': t('可用分组')
        }),
        width: '15%',
      },
    ];

    // 如果显示倍率列，则添加倍率列
    if (showRatioColumn) {
      baseColumns.push({
        title: () => (
            <span className="flex items-center gap-1">
            {t('倍率')}
              <Popover
                  content={
                    <div style={{ padding: 8 }}>
                      {t('倍率是为了方便换算不同价格的模型')}<br/>
                      {t('点击查看倍率说明')}
                    </div>
                  }
                  position='top'
                  style={{
                    backgroundColor: 'var(--semi-color-bg-2)',
                    borderColor: 'var(--semi-color-border)',
                    color: 'var(--semi-color-text-0)',
                    borderWidth: 1,
                    borderStyle: 'solid',
                  }}
              >
              <IconHelpCircle
                  onClick={() => {
                    setModalImageUrl('/ratio.png');
                    setIsModalOpenurl(true);
                  }}
                  className="cursor-pointer"
              />
            </Popover>
          </span>
        ),
        dataIndex: 'model_ratio',
        render: (text, record, index) => {
          let content = text;
          let completionRatio = parseFloat(record.completion_ratio.toFixed(3));
          content = (
              <div className="text-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span style={{ color: 'var(--semi-color-text-2)' }}>{t('模型')}：</span>
                  <span className="font-medium" style={{ color: 'var(--semi-color-text-0)' }}>{record.quota_type === 0 ? (typeof text === 'number' ? text.toFixed(3) : text) : t('无')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: 'var(--semi-color-text-2)' }}>{t('补全')}：</span>
                  <span className="font-medium" style={{ color: 'var(--semi-color-text-0)' }}>{record.quota_type === 0 ? completionRatio : t('无')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: 'var(--semi-color-text-2)' }}>{t('分组')}：</span>
                  <span className="font-medium" style={{ color: 'var(--semi-color-text-0)' }}>{typeof groupRatio[selectedGroup] === 'number' ? Number(groupRatio[selectedGroup]).toFixed(3) : groupRatio[selectedGroup]}</span>
                </div>
              </div>
          );
          return <div className="min-w-[50px]">{content}</div>;
        },
        className: 'min-w-[50px]',
        onCell: () => ({
          'data-column': t('倍率')
        }),
        width: '15%',
      });
    }

// 添加模型价格列
    baseColumns.push({
      title: () => (
          <div className="flex items-center gap-2 flex-wrap">
            <span>{t('模型价格')}</span>
            <Popover
                content={
                  <div style={{ padding: 8 }}>
                    {t('本站模型换算汇率为：1美元 =') + priceRatio + t('人民币')}<br/>
                    {t('点击切换币种')}
                  </div>
                }
                position='top'
                style={{
                  backgroundColor: 'var(--semi-color-bg-2)',
                  borderColor: 'var(--semi-color-border)',
                  color: 'var(--semi-color-text-0)',
                  borderWidth: 1,
                  borderStyle: 'solid',
                }}
            >
              <IconHelpCircle size="small" className="cursor-pointer" />
            </Popover>

            {/* 币种切换 */}
            <div className="inline-flex items-center rounded-md shadow-sm ml-auto sm:ml-0" style={{ backgroundColor: 'var(--semi-color-fill-0)' }}>
              <button
                  className={`px-1.5 py-0.5 rounded-md text-xs font-medium transition-all duration-200 ${
                      currencyType === 'USD'
                          ? 'shadow-sm'
                          : 'hover:text-gray-800'
                  }`}
                  style={{
                    backgroundColor: currencyType === 'USD' ? 'var(--semi-color-bg-2)' : 'transparent',
                    color: currencyType === 'USD' ? 'var(--semi-color-primary)' : 'var(--semi-color-text-2)'
                  }}
                  onClick={() => setCurrencyType('USD')}
                  aria-label="Use USD"
              >
                $
              </button>
              <button
                  className={`px-1.5 py-0.5 rounded-md text-xs font-medium transition-all duration-200 ${
                      currencyType === 'CNY'
                          ? 'shadow-sm'
                          : 'hover:text-gray-800'
                  }`}
                  style={{
                    backgroundColor: currencyType === 'CNY' ? 'var(--semi-color-bg-2)' : 'transparent',
                    color: currencyType === 'CNY' ? 'var(--semi-color-primary)' : 'var(--semi-color-text-2)'
                  }}
                  onClick={() => setCurrencyType('CNY')}
                  aria-label="Use CNY"
              >
                ￥
              </button>
            </div>
          </div>
      ),
      dataIndex: 'model_price',
      render: (text, record, index) => {
        let content = text;
        const currencySymbol = currencyType === 'USD' ? '$' : '￥';

        if (record.quota_type === 0) {
          // 这里的 *2 是因为 1倍率=0.002刀，请勿删除
          const inputRatioPrice = (record.model_ratio * 2 * groupRatio[selectedGroup]).toFixed(2);
          const completionRatioPrice = (record.model_ratio * record.completion_ratio * 2 * groupRatio[selectedGroup]).toFixed(2);

          content = (
              <div className="space-y-1 text-sm">
                <div className="flex items-center justify-between rounded-md px-2 py-1" style={{
                  backgroundColor: 'var(--semi-color-primary-light-default)',
                  color: 'var(--semi-color-primary)'
                }}>
                  <div className="flex items-center space-x-1 font-medium" style={{ color: 'var(--semi-color-primary)' }}>
                    <SparklesIcon className="w-5 h-5" />
                    <span>{t('提示')}:</span>
                  </div>
                  <span className="font-medium" style={{ color: 'var(--semi-color-primary)' }}>
                    {currencySymbol}
                              {currencyType === 'CNY'
                                  ? (parseFloat(inputRatioPrice) * priceRatio).toFixed(2)
                                  : inputRatioPrice} / 1M
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-md px-2 py-1" style={{
                  backgroundColor: 'var(--semi-color-success-light-default)',
                  color: 'var(--semi-color-success)'
                }}>
                  <div className="flex items-center space-x-1 font-medium" style={{ color: 'var(--semi-color-success)' }}>
                    <FaceSmileIcon className="w-5 h-5" />
                    <span>{t('补全')}:</span>
                  </div>
                  <span className="font-medium" style={{ color: 'var(--semi-color-success)' }}>
                    {currencySymbol}
                              {currencyType === 'CNY'
                                  ? (parseFloat(completionRatioPrice) * priceRatio).toFixed(2)
                                  : completionRatioPrice} / 1M
                  </span>
                </div>
              </div>
          );
        } else {
          const price = (parseFloat(text) * groupRatio[selectedGroup]).toFixed(2);
          content = (
              <div className="p-4 rounded-lg shadow-sm max-w-md mx-auto flex items-center justify-between text-sm" style={{
                backgroundColor: 'var(--semi-color-bg-2)',
                color: 'var(--semi-color-text-0)'
              }}>
                <span style={{ color: 'var(--semi-color-text-2)' }}>{t('模型价格')}</span>
                <span className="font-medium" style={{ color: 'var(--semi-color-primary)' }}>
                  {currencySymbol}{price}
                </span>
              </div>
          );
        }



        return <div className="model-price-cell min-w-[150px]">{content}</div>;
      },
      className: 'min-w-[100px]',
      onCell: () => ({
        'data-column': t('模型价格')
      }),
      width: '15%',
    });

    baseColumns.push(
        {
          title: t('模型描述'),
          dataIndex: 'model_description',
          render: (text, record, index) => {
            return (
                <Tooltip content={text} position="top">
                  <div className="inline-flex items-start px-2.5 py-1.5 leading-5 max-w-full" style={{ fontSize: '12px', color: 'var(--semi-color-text-2)' }}>
                    <div className="line-clamp-4 min-h-[5em]">
                      {text}
                    </div>
                  </div>
                </Tooltip>
            );
          },
          className: 'min-w-[200px]',
          onCell: () => ({
            'data-column': t('模型描述')
          }),
          width: '20%',
        }
    )

    return baseColumns;
  }, [t, selectedGroup, groupRatio, filteredValue, usableGroup, showRatioColumn, currencyType]);

  const setModelsFormat = useCallback((models, groupRatio) => {
    for (let i = 0; i < models.length; i++) {
      models[i].key = models[i].model_name;
      models[i].group_ratio = groupRatio[models[i].model_name];
    }
    // sort by quota_type
    models.sort((a, b) => {
      return a.quota_type - b.quota_type;
    });

    // sort by model_name, start with gpt is max, other use localeCompare
    models.sort((a, b) => {
      if (a.model_name.startsWith('gpt') && !b.model_name.startsWith('gpt')) {
        return -1;
      } else if (
        !a.model_name.startsWith('gpt') &&
        b.model_name.startsWith('gpt')
      ) {
        return 1;
      } else {
        return a.model_name.localeCompare(b.model_name);
      }
    });

    setModels(models);
  }, []);

  // 点击快速接入按钮
  const handleQuickAccess = () => {
    setApiDrawerVisible(true);
  };

  const loadPricing = useCallback(async () => {
    setLoading(true);

    let url = '';
    url = `/api/pricing`;
    try {
      const res = await API.get(url);
      const { success, message, data, group_ratio, usable_group } = res.data;
      if (success) {
        // usable_group 去除default
        const usableGroupFiltered = {};
        for (const group in usable_group) {
          if (group !== '') {
            usableGroupFiltered[group] = usable_group[group];
          }
        }

        setGroupRatio(group_ratio);
        setUsableGroup(usableGroupFiltered);
        setSelectedGroup('default')
        setModelsFormat(data, group_ratio);
      } else {
        showError(message);
      }
    } catch (error) {
      showError('获取模型价格失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [userState.user, setModelsFormat]);

  const refresh = useCallback(async () => {
    await loadPricing();
  }, [loadPricing]);

  // 加载分组下拉框选项
  const loadGroupOptions = useCallback(() => {
    if (Object.keys(usableGroup).length > 0) {
      const options = Object.keys(usableGroup)
        .filter(group => usableGroup[group])
        .map(group => ({
          label: (
            <div className="group-option">
              <span>{group}</span>
              <span className="group-ratio-badge">倍率x{groupRatio[group]}</span>
            </div>
          ),
          value: group
        }));
      setGroupOptions(options);
    }
  }, [usableGroup, groupRatio]);

  // 处理分组变更
  const handleGroupChange = useCallback((value) => {
    setSelectedGroup(value);
    setActivePage(1); // 重置页码为第一页
    showInfo(t('当前查看的分组为：{{group}}，倍率为：{{ratio}}', {
      group: value,
      ratio: groupRatio[value]
    }));
  }, [t, groupRatio]);

  
  // 当模型数据加载完成后重新检查
  useEffect(() => {
    if (models.length > 0) {
      loadGroupOptions();
    }
  }, [models,  loadGroupOptions]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <>

      {/* API接入指南抽屉 */}
      <ApiGuideDrawer
          visible={apiDrawerVisible}
          onClose={() => setApiDrawerVisible(false)}
          baseUrl=""
          modelId="gpt-4o"
      />

      <Layout>
        {/* 添加内联样式 */}
        <style>{tableStyles}</style>
        <style>{getMobileStyles()}</style>
        <div className="model-pricing-section">
          <Card className="pricing-card">
            <div className="mb-4">
              <Banner
                  type="info"
                  fullMode={false}
                  description={<div>{t('本站模型换算汇率为：1美元 =') + priceRatio + t('人民币')}</div>}
                  closeIcon={null}
              />
            </div>

            <div className="mb-4">
              <Banner
                  type="info"
                  fullMode={false}
                  description={<div>{t('按量计费费用 = 分组倍率 × 模型倍率 × （提示token数 + 补全token数 × 补全倍率）/ 500000 ')}</div>}
                  closeIcon={null}
              />
            </div>

            {/* 供应商导航栏 */}
            <div className="provider-section mb-4">
              <div className="section-title">{t('按供应商过滤')}
                <span style={{marginLeft: '10px'}}>

                  <Button theme="light" type="primary" size="default" onClick={handleQuickAccess}>
                    <div className="flex items-center">
                      <IconVerify style={{ fontSize: '20px', marginRight: '4px' }} />
                      快速接入
                    </div>
                </Button>
               </span>
              </div>
              <div className="provider-navbar" style={{ position: 'relative', paddingLeft: '12px', paddingRight: '12px' }}>
                {showLeftScroll && (
                    <div className="relative group" style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 10 }}>
                      <button
                          className="provider-scroll-btn scroll-left"
                          aria-label="显示所有供应商"
                          onClick={() => handleScroll('left')}
                          style={{ 
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
                            backgroundColor: 'var(--semi-color-bg-2)', 
                            borderRadius: '50%', 
                            width: '32px', 
                            height: '32px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center' 
                          }}
                      >
                        <IconChevronLeft size="large" />
                      </button>

                      {/* Dropdown that appears on hover */}
                      <div
                          className="
                          absolute left-0 top-full mt-2 w-64
                          bg-white bg-opacity-60 backdrop-blur-sm
                          border border-gray-200 rounded-xl shadow-lg
                          opacity-0 invisible group-hover:opacity-100 group-hover:visible
                          transition-opacity duration-200 ease-out
                          max-h-80    overflow-x-hidden overflow-y-auto
                          overscroll-contain scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent z-20
                          "
                      >
                        <div className="py-2 divide-y divide-gray-100">
                          {providers.map(provider => (
                              <div
                                  key={provider.id}
                                  className={`
                                    provider-item
                                    flex items-center px-4 py-3
                                    hover:bg-gray-50 cursor-pointer
                                    transition-colors duration-150
                                    ${selectedProvider === provider.id ? 'bg-blue-50' : ''}
                                  `}
                                  onClick={() => {
                                    setSelectedProvider(provider.id);
                                    setActivePage(1); // 重置页码为第一页
                                    // Close popover after selection
                                    document.body.click();
                                    // Scroll to the selected provider in the navigation bar
                                    setTimeout(() => {
                                      const providerElements = providerScrollRef.current.querySelectorAll('.provider-item');
                                      for (let i = 0; i < providerElements.length; i++) {
                                        if (providerElements[i].textContent.includes(provider.name)) {
                                          const containerWidth = providerScrollRef.current.clientWidth;
                                          const elementOffset = providerElements[i].offsetLeft;
                                          providerScrollRef.current.scrollTo({
                                            left: elementOffset - containerWidth / 2 + providerElements[i].offsetWidth / 2,
                                            behavior: 'smooth'
                                          });
                                          break;
                                        }
                                      }
                                    }, 100);
                                  }}
                              >
                                <div className="flex-shrink-0 mr-3">
                                  {provider.icon ? (
                                      <img
                                          src={provider.icon}
                                          alt={provider.name}
                                          className="w-6 h-6 rounded-full object-cover"
                                      />
                                  ) : (
                                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                                        {provider.name.charAt(0)}
                                      </div>
                                  )}
                                </div>
                                <div className="flex-grow text-sm font-medium text-gray-700">
                                  {provider.name}
                                </div>
                                <div className="ml-auto bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                                  {providerCounts[provider.id] || 0}
                                </div>
                              </div>
                          ))}
                        </div>
                      </div>
                    </div>
                )}

                <div
                    className="provider-scroll-container"
                    ref={providerScrollRef}
                    style={{ margin: '0 8px' }}
                >
                  {providers.map(provider => (
                      <div
                          key={provider.id}
                          className={`provider-item ${selectedProvider === provider.id ? 'active' : ''}`}
                          onClick={(e) => {
                            e.preventDefault(); // 阻止默认行为
                            setSelectedProvider(provider.id);
                            setActivePage(1); // 重置页码为第一页
                          }}
                      >
                        <div className="provider-icon">
                          {provider.icon ? (
                              <Avatar
                                  src={provider.icon}
                                  size="small"
                                  alt={provider.name}
                              />
                          ) : (
                              <div className="provider-fallback-icon">{provider.name.charAt(0)}</div>
                          )}
                        </div>
                        <span className="provider-name">{provider.name}</span>
                        <span className="provider-count">{providerCounts[provider.id] || 0}</span>
                      </div>
                  ))}
                </div>

                {showRightScroll && (
                    <div className="relative group" style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 10 }}>
                      <button
                          className="provider-scroll-btn scroll-right"
                          aria-label="显示所有供应商"
                          onClick={() => handleScroll('right')}
                          style={{ 
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
                            backgroundColor: 'var(--semi-color-bg-2)', 
                            borderRadius: '50%', 
                            width: '32px', 
                            height: '32px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center' 
                          }}
                      >
                        <IconChevronRight size="large" />
                      </button>

                      {/* Dropdown that appears on hover */}
                      <div
                          className="
                          absolute right-0 top-full mt-2 w-64
                          bg-white bg-opacity-60 backdrop-blur-sm
                          border border-gray-200 rounded-xl shadow-lg
                          opacity-0 invisible group-hover:opacity-100 group-hover:visible
                          transition-opacity duration-200 ease-out
                          max-h-80    overflow-x-hidden overflow-y-auto
                          overscroll-contain scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent z-20
                          "
                      >
                        <div className="py-2 divide-y divide-gray-100">
                          {providers.map(provider => (
                              <div
                                  key={provider.id}
                                  className={`
                                    provider-item
                                    flex items-center px-4 py-3
                                    hover:bg-gray-50 cursor-pointer
                                    transition-colors duration-150
                                    ${selectedProvider === provider.id ? 'bg-blue-50' : ''}
                                  `}
                                  onClick={() => {
                                    setSelectedProvider(provider.id);
                                    setActivePage(1); // 重置页码为第一页
                                    // Close popover after selection
                                    document.body.click();
                                    // Scroll to the selected provider in the navigation bar
                                    setTimeout(() => {
                                      const providerElements = providerScrollRef.current.querySelectorAll('.provider-item');
                                      for (let i = 0; i < providerElements.length; i++) {
                                        if (providerElements[i].textContent.includes(provider.name)) {
                                          const containerWidth = providerScrollRef.current.clientWidth;
                                          const elementOffset = providerElements[i].offsetLeft;
                                          providerScrollRef.current.scrollTo({
                                            left: elementOffset - containerWidth / 2 + providerElements[i].offsetWidth / 2,
                                            behavior: 'smooth'
                                          });
                                          break;
                                        }
                                      }
                                    }, 100);
                                  }}
                              >
                                <div className="flex-shrink-0 mr-3">
                                  {provider.icon ? (
                                      <img
                                          src={provider.icon}
                                          alt={provider.name}
                                          className="w-6 h-6 rounded-full object-cover"
                                      />
                                  ) : (
                                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                                        {provider.name.charAt(0)}
                                      </div>
                                  )}
                                </div>
                                <div className="flex-grow text-sm font-medium text-gray-700">
                                  {provider.name}
                                </div>
                                <div className="ml-auto bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                                  {providerCounts[provider.id] || 0}
                                </div>
                              </div>
                          ))}
                        </div>
                      </div>
                    </div>
                )}
              </div>
            </div>

            <div className="action-bar mb-4">
              <div className="search-section">
                <Input
                    prefix={<IconHelpCircle size="small" />}
                    placeholder={t('模糊搜索模型名称')}
                    style={{ width: 220 }}
                    onCompositionStart={handleCompositionStart}
                    onCompositionEnd={handleCompositionEnd}
                    onChange={handleChange}
                    showClear
                />
              </div>

              <div className="group-selector">
                <Select
                    prefix={<IconFilter size="small" />}
                    placeholder={t('选择分组')}
                    value={selectedGroup}
                    onChange={handleGroupChange}
                    optionList={groupOptions}
                    style={{ width: 200 }}
                    className="group-select"
                />
              </div>

              {/* Add the toggle switch here */}
              <div className="group-toggle ml-2 flex items-center">
                <span className="text-sm text-gray-500 mr-2">{t('仅显示当前分组')}</span>
                <div
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${showOnlySelectedGroup ? 'bg-blue-600' : 'bg-gray-200'}`}
                    onClick={() => {
                      setShowOnlySelectedGroup(!showOnlySelectedGroup);
                      setActivePage(1); // 重置页码为第一页
                    }}
                    role="switch"
                    aria-checked={showOnlySelectedGroup}
                    tabIndex="0"
                >
                  <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${showOnlySelectedGroup ? 'translate-x-6' : 'translate-x-1'}`}
                  />
                </div>
              </div>

              <div className="model-count">
                <IconStar size="small" style={{ marginRight: '6px', color: 'rgba(var(--semi-blue-5), 1)' }} />
                {t('当前展示 {{count}} 个模型', { count: filteredModels.length })}
                {(selectedProvider !== '全部' || filteredValue.length > 0) && (
                    <Button
                        type="tertiary"
                        theme="borderless"
                        onClick={(e) => {
                          e.preventDefault(); // 阻止默认行为
                          setSelectedProvider('全部');
                          setFilteredValue([]);
                          setActivePage(1); // 重置页码为第一页
                        }}
                        style={{marginLeft: '8px'}}
                    >
                      {t('清除筛选')}
                    </Button>
                )}
              </div>

              <div className="action-buttons">
                <Button
                    theme='light'
                    type='tertiary'
                    style={{width: 150}}
                    onClick={(e) => {
                      copyText(selectedRowKeys);
                    }}
                    disabled={selectedRowKeys == ""}
                    icon={<IconTerminal size="small" />}
                >
                  {t('复制选中模型')}
                </Button>

                <Button
                    theme='light'
                    type='tertiary'
                    style={{marginLeft: 8}}
                    onClick={() => setShowRatioColumn(!showRatioColumn)}
                    icon={showRatioColumn ? <IconHelpCircle size="small" /> : <IconHelpCircle size="small" />}
                    className="toggle-ratio-btn"
                >
                  {showRatioColumn ? t('隐藏倍率列') : t('显示倍率列')}
                </Button>
              </div>
            </div>

            {/* 添加表格容器，增强滚动体验 */}
            <div className="relative overflow-hidden md:rounded-lg border border-gray-200 shadow-sm hidden md:block">
              <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 mobile-table-container max-w-full lg:max-w-[95vw] xl:max-w-[1400px] 2xl:max-w-[1800px] mx-auto">
                <Table
                    style={{ marginTop: 0, width: '100%', tableLayout: 'fixed' }}
                    columns={columns}
                    dataSource={filteredModels}
                    loading={loading}
                    pagination={{
                      formatPageText: (page) =>
                          t('第 {{start}} - {{end}} 条，共 {{total}} 条', {
                            start: page.currentStart,
                            end: page.currentEnd,
                            total: filteredModels.length
                          }),
                      pageSize: pageSize,
                      total: filteredModels.length,
                      showSizeChanger: true,
                      pageSizeOptions: [10, 20, 50, 100],
                      onPageSizeChange: (size) => {
                        setPageSize(size);
                        setActivePage(1);
                      },
                      onPageChange: (page) => setActivePage(page)
                    }}
                    rowSelection={rowSelection}
                    className="responsive-table model-table w-full"
                    empty={
                      <div className="empty-state">
                        <p>{t('没有找到匹配的模型')}</p>
                        <Button
                            type="tertiary"
                            onClick={(e) => {
                              e.preventDefault(); // 阻止默认行为
                              setSelectedProvider('全部');
                              setFilteredValue([]);
                              setActivePage(1); // 重置页码为第一页
                            }}
                            className="mx-auto"
                          >
                            {t('重置筛选条件')}
                          </Button>
                      </div>
                    }
                    scroll={{ x: '100%' }}
                    rowClassName={(record, index) => 
                      index % 2 === 0 ? 'bg-white hover:bg-blue-50 transition-colors' : 'bg-gray-50 hover:bg-blue-50 transition-colors'
                    }
                    headerClassName="bg-gray-100 text-gray-700 font-medium sticky top-0 z-10"
                    wrapperClassName="border-collapse w-full"
                    onRow={(record, index) => ({
                      onClick: () => {}, // 需要一个空函数，否则在某些情况下可能会报错
                    })}
                    onHeaderRow={() => ({
                      className: 'semi-table-header-row',
                    })}
                />
              </div>
              
              {/* 滚动阴影指示器 - 桌面端 */}
              <div className="hidden lg:hidden md:block absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none scroll-indicator"></div>
              <div className="hidden lg:hidden md:block absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none scroll-indicator"></div>
            </div>

            {/* 移动端卡片视图 - 替代表格 */}
            <div className="md:hidden mt-4 space-y-4">
              {filteredModels.length === 0 ? (
                <div className="empty-state py-8 text-center">
                  <p className="text-gray-500 mb-3">{t('没有找到匹配的模型')}</p>
                  <Button
                    type="tertiary"
                    onClick={(e) => {
                      e.preventDefault(); // 阻止默认行为
                      setSelectedProvider('全部');
                      setFilteredValue([]);
                      setActivePage(1); // 重置页码为第一页
                    }}
                    className="mx-auto"
                  >
                    {t('重置筛选条件')}
                  </Button>
                </div>
              ) : (
                filteredModels.slice((activePage-1) * pageSize, activePage * pageSize).map((model, index) => (
                  <div key={model.key} className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                    <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
                      <div className="flex justify-between items-center">
                        <div
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer whitespace-nowrap max-w-full overflow-hidden"
                          style={{
                            background: 'linear-gradient(to right, var(--semi-color-primary-light-default), var(--semi-color-primary-light-hover))',
                            color: 'var(--semi-color-primary)',
                            borderColor: 'var(--semi-color-primary-light-active)',
                            borderWidth: '1px',
                            borderStyle: 'solid'
                          }}
                          onClick={() => copyText(model.model_name)}
                          title={model.model_name}
                        >
                          <span className="truncate">{model.model_name}</span>
                        </div>
                        {model.enable_groups.includes(selectedGroup) ? (
                          <div className="flex items-center text-green-600 bg-green-50 py-1 px-2 rounded-md border border-green-200">
                            <IconVerify size="small" />
                            <span className="ml-1 text-xs font-medium">{t('当前分组可用')}</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-red-600 bg-red-50 py-1 px-2 rounded-md border border-red-200">
                            <IconClose size="small" />
                            <span className="ml-1 text-xs font-medium">{t('当前分组不可用')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">{t('计费类型')}</span>
                        <div>{renderQuotaType(parseInt(model.quota_type))}</div>
                      </div>
                      
                      <div>
                        <div className="text-gray-700 mb-1">{t('可用分组')}</div>
                        <div className="flex flex-wrap gap-1">
                          {model.enable_groups.map((group, idx) => {
                            if (usableGroup[group]) {
                              const colors = [
                                'bg-blue-100 text-blue-800',
                                'bg-green-100 text-green-800',
                                'bg-purple-100 text-purple-800',
                                'bg-red-100 text-red-800',
                                'bg-yellow-100 text-yellow-800',
                              ];
                              const colorClass = colors[idx % colors.length];
                              
                              if (group === selectedGroup) {
                                return (
                                  <div key={group} className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorClass} border border-current`}>
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                    {group}
                                  </div>
                                );
                              } else {
                                return (
                                  <div
                                    key={group}
                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorClass} cursor-pointer hover:opacity-80 transition-opacity`}
                                    onClick={() => {
                                      setSelectedGroup(group);
                                      setActivePage(1); // 重置页码为第一页
                                      showInfo(t('当前查看的分组为：{{group}}，倍率为：{{ratio}}', {
                                        group: group,
                                        ratio: groupRatio[group]
                                      }));
                                    }}
                                  >
                                    {group}
                                  </div>
                                );
                              }
                            }
                            return null;
                          })}
                        </div>
                      </div>
                      
                      {showRatioColumn && (
                        <div>
                          <div className="text-gray-700 mb-1">{t('倍率')}</div>
                          <div className="bg-gray-50 p-2 rounded text-sm space-y-1">
                            <div className="flex justify-between">
                              <span className="text-gray-600">{t('模型倍率')}</span>
                              <span className="font-medium">{model.quota_type === 0 ? model.model_ratio : t('无')}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">{t('补全倍率')}</span>
                              <span className="font-medium">{model.quota_type === 0 ? parseFloat(model.completion_ratio.toFixed(3)) : t('无')}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">{t('分组倍率')}</span>
                              <span className="font-medium">{groupRatio[selectedGroup]}</span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <div className="text-gray-700 mb-1">{t('模型价格')}</div>
                        <div className="bg-blue-50 p-2 rounded text-sm">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-600">{t('币种')}</span>
                            <div className="inline-flex items-center bg-gray-100 rounded-md shadow-sm">
                              <button
                                className={`px-1.5 py-0.5 rounded-md text-xs font-medium transition-all duration-200 ${
                                  currencyType === 'USD'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                                }`}
                                onClick={() => setCurrencyType('USD')}
                                aria-label="Use USD"
                              >
                                $
                              </button>
                              <button
                                className={`px-1.5 py-0.5 rounded-md text-xs font-medium transition-all duration-200 ${
                                  currencyType === 'CNY'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                                }`}
                                onClick={() => setCurrencyType('CNY')}
                                aria-label="Use CNY"
                              >
                                ￥
                              </button>
                            </div>
                          </div>
                          {model.quota_type === 0 ? (
                            <>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600">{t('提示')}</span>
                                <span className="font-medium text-blue-600">
                                  {currencyType === 'USD' ? '$' : '￥'}
                                  {currencyType === 'CNY'
                                    ? ((model.model_ratio * 2 * groupRatio[selectedGroup]) * priceRatio).toFixed(2)
                                    : (model.model_ratio * 2 * groupRatio[selectedGroup]).toFixed(2)} / 1M tokens
                                </span>
                              </div>
                              <div className="flex justify-between items-center mt-1">
                                <span className="text-gray-600">{t('补全')}</span>
                                <span className="font-medium text-blue-600">
                                  {currencyType === 'USD' ? '$' : '￥'}
                                  {currencyType === 'CNY'
                                    ? ((model.model_ratio * model.completion_ratio * 2 * groupRatio[selectedGroup]) * priceRatio).toFixed(2)
                                    : (model.model_ratio * model.completion_ratio * 2 * groupRatio[selectedGroup]).toFixed(2)} / 1M tokens
                                </span>
                              </div>
                            </>
                          ) : (
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">{t('模型价格')}</span>
                              <span className="font-medium text-blue-600">
                                {currencyType === 'USD' ? '$' : '￥'}
                                {(parseFloat(model.model_price) * groupRatio[selectedGroup]).toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-gray-700 mb-1">{t('模型描述')}</div>
                        <div className="text-gray-600 text-sm line-clamp-4 min-h-[5em] bg-gray-50 p-2 rounded">
                          {model.model_description}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              {/* 移动端分页器 */}
              {filteredModels.length > 0 && (
                <div className="flex flex-col items-center mt-6 gap-3">
                  <div className="inline-flex items-center shadow-sm rounded-md">
                    <button 
                      className="px-3 py-1 bg-white border border-gray-300 rounded-l-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={activePage === 1}
                      onClick={() => setActivePage(prev => prev - 1)}
                    >
                      <IconChevronLeft size="small" />
                    </button>
                    <div className="px-4 py-1 bg-white border-t border-b border-gray-300 text-gray-700">
                      {activePage} / {Math.ceil(filteredModels.length / pageSize)}
                    </div>
                    <button 
                      className="px-3 py-1 bg-white border border-gray-300 rounded-r-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={activePage === Math.ceil(filteredModels.length / pageSize)}
                      onClick={() => setActivePage(prev => prev + 1)}
                    >
                      <IconChevronRight size="small" />
                    </button>
                  </div>
                  
                  {/* 每页显示条数选择 */}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600">{t('每页显示')}:</span>
                    <div className="inline-flex rounded-md shadow-sm">
                      {[5, 10, 20, 50].map(size => (
                        <button
                          key={size}
                          className={`px-2.5 py-1 border border-gray-300 text-xs font-medium ${
                            pageSize === size
                              ? 'bg-blue-50 text-blue-700 border-blue-300 z-10'
                              : 'bg-white text-gray-700 hover:bg-gray-50'
                          } ${
                            size === 5 ? 'rounded-l-md' : ''
                          } ${
                            size === 50 ? 'rounded-r-md' : ''
                          }`}
                          onClick={() => {
                            setPageSize(size);
                            setActivePage(1);
                          }}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                    <span className="text-gray-600">{t('条')}</span>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    {t('第 {{start}} - {{end}} 条，共 {{total}} 条', {
                      start: Math.min((activePage - 1) * pageSize + 1, filteredModels.length),
                      end: Math.min(activePage * pageSize, filteredModels.length),
                      total: filteredModels.length
                    })}
                  </div>
                </div>
              )}
            </div>

            <ImagePreview
                src={modalImageUrl}
                visible={isModalOpenurl}
                onVisibleChange={(visible) => setIsModalOpenurl(visible)}
            />
          </Card>
        </div>
      </Layout>
    </>
  );
};

export default ModelPricing;
