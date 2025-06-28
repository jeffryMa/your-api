import React from 'react';
import { Layout, Card, Typography, Row, Col } from '@douyinfe/semi-ui';
import { IconUser, IconComment, IconMail, IconClock } from '@douyinfe/semi-icons';

import './style.css';

const { Title, Text, Paragraph } = Typography;

const Contact = () => {
    return (
        <section className="contact-layout semi-layout">
            <main className="contact-content semi-layout-content">
                <div className="contact-container">
                    <div className="contact-header">
                        <div className="header-content">
                            <Title className="header-title"  heading="header-title">联系我们</Title>
                            <Paragraph className="header-description">如有任何问题或建议或合作交流，请随时联系我们的客服团队。我们将竭诚为您服务！</Paragraph>
                        </div>
                    </div>

                    <div className="contact-grid">
                        <Row gutter={16}>
                            <Col xs={24} sm={8} md={8}>
                                <Card className="contact-card" bordered>
                                    <div className="contact-card-content">
                                        <div className="contact-icon" style={{
                                            backgroundColor: 'rgba(7, 193, 96, 0.082)',
                                            borderColor: 'rgba(7, 193, 96, 0.19)',
                                            color: 'rgb(7, 193, 96)'
                                        }}>
                                            <IconUser />
                                        </div>
                                        <div className="contact-info">
                                            <Title className="contact-title" heading={6}>微信</Title>
                                            <Text className="contact-text">请先加QQ群</Text>
                                        </div>
                                    </div>
                                </Card>
                            </Col>

                            <Col xs={24} sm={8} md={8}>
                                <Card className="contact-card" bordered>
                                    <div className="contact-card-content">
                                        <div className="contact-icon" style={{
                                            backgroundColor: 'var(--semi-color-info-15)',
                                            borderColor: 'var(--semi-color-info-30)',
                                            color: 'var(--semi-color-info)'
                                        }}>
                                            <IconComment />
                                        </div>
                                        <div className="contact-info">
                                            <Title className="contact-title" heading={6}>QQ群</Title>
                                            <Text className="contact-text">695748333</Text>
                                        </div>
                                    </div>
                                </Card>
                            </Col>

                            <Col xs={24} sm={8} md={8}>
                                <Card className="contact-card" bordered>
                                    <div className="contact-card-content">
                                        <div className="contact-icon" style={{
                                            backgroundColor: 'var(--semi-color-primary-15)',
                                            borderColor: 'var(--semi-color-primary-30)',
                                            color: 'var(--semi-color-primary)'
                                        }}>
                                            <IconMail />
                                        </div>
                                        <div className="contact-info">
                                            <Title className="contact-title" heading={6}>邮箱地址</Title>
                                            <Text className="contact-text">3434581088@qq.com</Text>
                                        </div>
                                    </div>
                                </Card>
                            </Col>
                        </Row>
                    </div>

                    <Card className="work-time-card" bordered>
                        <div className="work-time-content">
                            <div className="work-time-icon">
                                <IconClock />
                            </div>
                            <div className="work-time-info">
                                <Title className="work-time-title" heading={4}>服务时间</Title>
                                <Text className="work-time-text">周一至周日 8:00-22:00</Text>
                            </div>
                        </div>
                    </Card>
                </div>
            </main>
        </section>
    )
};

export default Contact;
