import React, { useEffect, useState, useRef } from 'react';
import { Button, Col, Form, Row, Spin, Banner } from '@douyinfe/semi-ui';
import {
  compareObjects,
  API,
  showError,
  showSuccess,
  showWarning,
  verifyJSON,
} from '../../../helpers';
import { useTranslation } from 'react-i18next';

export default function SettingGlobalModel(props) {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState({
    'global.pass_through_request_enabled': false,
    'general_setting.ping_interval_enabled': false,
    'general_setting.ping_interval_seconds': 60,
    'global.model_token_limit': '', // 新增
  });
  const refForm = useRef();
  const [inputsRow, setInputsRow] = useState(inputs);

  function onSubmit() {
    const updateArray = compareObjects(inputs, inputsRow);
    if (!updateArray.length) return showWarning(t('你似乎并没有修改什么'));
    const requestQueue = updateArray.map((item) => {
      let value = String(inputs[item.key]);

      return API.put('/api/option/', {
        key: item.key,
        value,
      });
    });
    setLoading(true);
    Promise.all(requestQueue)
      .then((res) => {
        if (requestQueue.length === 1) {
          if (res.includes(undefined)) return;
        } else if (requestQueue.length > 1) {
          if (res.includes(undefined))
            return showError(t('部分保存失败，请重试'));
        }
        showSuccess(t('保存成功'));
        props.refresh();
      })
      .catch(() => {
        showError(t('保存失败，请重试'));
      })
      .finally(() => {
        setLoading(false);
      });
  }

  useEffect(() => {
    // 以 inputs 的 key 为基准，props.options 里有就用，没有就用默认
    const currentInputs = { ...inputs };
    for (let key in currentInputs) {
      if (props.options.hasOwnProperty(key)) {
        currentInputs[key] = props.options[key];
      }
    }
    setInputs(currentInputs);
    setInputsRow(structuredClone(currentInputs));
    refForm.current.setValues(currentInputs);
  }, [props.options]);

  return (
    <>
      <Spin spinning={loading}>
        <Form
          values={inputs}
          getFormApi={(formAPI) => (refForm.current = formAPI)}
          style={{ marginBottom: 15 }}
        >
          <Form.Section text={t('全局设置')}>
            <Row>
              <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                <Form.Switch
                  label={t('启用请求透传')}
                  field={'global.pass_through_request_enabled'}
                  onChange={(value) =>
                    setInputs({
                      ...inputs,
                      'global.pass_through_request_enabled': value,
                    })
                  }
                  extraText={
                    '开启后，所有请求将直接透传给上游，不会进行任何处理（重定向和渠道适配也将失效）,请谨慎开启'
                  }
                />
              </Col>
            </Row>
            {/* 新增模型token限制配置项 */}
            <Row>
              <Col xs={24} sm={24} md={16} lg={12} xl={8}>
                <Form.TextArea
                  label={t('模型最大Token限制（JSON，key为平台模型名称）')}
                  field={'global.model_token_limit'}
                  placeholder={t('如 {"my-gpt4-proxy": 20000, "my-claude3": 16000}')}
                  extraText={t('示例：{"my-gpt4-proxy": 20000, "my-claude3": 16000}，key为平台自定义模型名称')}
                  autosize={{ minRows: 4, maxRows: 10 }}
                  trigger='blur'
                  stopValidateWithError
                  rules={[
                    {
                      validator: (rule, value) => verifyJSON(value),
                      message: t('不是合法的 JSON 字符串'),
                    },
                  ]}
                  onChange={(value) =>
                    setInputs({
                      ...inputs,
                      'global.model_token_limit': value,
                    })
                  }
                />
              </Col>
            </Row>
            
            <Form.Section text={t('连接保活设置')}>
            <Row style={{ marginTop: 10 }}>
                  <Col span={24}>
                    <Banner 
                      type="warning"
                      description="警告：启用保活后，如果已经写入保活数据后渠道出错，系统无法重试，如果必须开启，推荐设置尽可能大的Ping间隔"
                    />
                  </Col>
                </Row>
              <Row>
                <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                  <Form.Switch
                    label={t('启用Ping间隔')}
                    field={'general_setting.ping_interval_enabled'}
                    onChange={(value) => setInputs({ ...inputs, 'general_setting.ping_interval_enabled': value })}
                    extraText={'开启后，将定期发送ping数据保持连接活跃'}
                  />
                </Col>
                <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                  <Form.InputNumber
                    label={t('Ping间隔（秒）')}
                    field={'general_setting.ping_interval_seconds'}
                    onChange={(value) => setInputs({ ...inputs, 'general_setting.ping_interval_seconds': value })}
                    min={1}
                    disabled={!inputs['general_setting.ping_interval_enabled']}
                  />
                </Col>
              </Row>
            </Form.Section>

            <Row>
              <Button size='default' onClick={onSubmit}>
                {t('保存')}
              </Button>
            </Row>
          </Form.Section>
        </Form>
      </Spin>
    </>
  );
}
