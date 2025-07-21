package model_setting

import (
	"encoding/json"
	"one-api/setting/config"
)

type GlobalSettings struct {
	PassThroughRequestEnabled bool   `json:"pass_through_request_enabled"`
	ModelTokenLimit          string `json:"model_token_limit"` // JSON字符串，key为平台模型名称
}

// 默认配置
var defaultOpenaiSettings = GlobalSettings{
	PassThroughRequestEnabled: false,
}

// 全局实例
var globalSettings = defaultOpenaiSettings

func init() {
	// 注册到全局配置管理器
	config.GlobalConfig.Register("global", &globalSettings)
}

func GetGlobalSettings() *GlobalSettings {
	return &globalSettings
}

// 新增：获取模型token限制
func GetModelTokenLimit(modelName string) int {
	var limits map[string]int
	err := json.Unmarshal([]byte(globalSettings.ModelTokenLimit), &limits)
	if err != nil || limits == nil {
		return 0
	}
	return limits[modelName]
}
