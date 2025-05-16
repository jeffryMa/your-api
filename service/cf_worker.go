package service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"one-api/common"
	"one-api/setting"
	"one-api/setting/operation_setting"
	"strings"
	"sync"
)

var (
	proxyClient     *http.Client
	normalClient    = &http.Client{}
	lastProxyURL    string
	httpClientMutex sync.RWMutex
)

// getProxyClient 获取或创建代理HTTP客户端
func getProxyClient(proxyURLStr string) (*http.Client, error) {
	httpClientMutex.RLock()
	if proxyClient != nil && lastProxyURL == proxyURLStr {
		defer httpClientMutex.RUnlock()
		return proxyClient, nil
	}
	httpClientMutex.RUnlock()

	// 需要创建新客户端，获取写锁
	httpClientMutex.Lock()
	defer httpClientMutex.Unlock()

	// 双重检查
	if proxyClient != nil && lastProxyURL == proxyURLStr {
		return proxyClient, nil
	}

	// 解析代理URL
	proxyURL, err := url.Parse(proxyURLStr)
	if err != nil {
		return nil, fmt.Errorf("invalid proxy URL: %v", err)
	}

	// 创建新的HTTP客户端
	proxyClient = &http.Client{
		Transport: &http.Transport{
			Proxy: http.ProxyURL(proxyURL),
		},
	}
	lastProxyURL = proxyURLStr

	return proxyClient, nil
}

// WorkerRequest Worker请求的数据结构
type WorkerRequest struct {
	URL     string            `json:"url"`
	Key     string            `json:"key"`
	Method  string            `json:"method,omitempty"`
	Headers map[string]string `json:"headers,omitempty"`
	Body    json.RawMessage   `json:"body,omitempty"`
}

// DoWorkerRequest 通过Worker发送请求
func DoWorkerRequest(req *WorkerRequest) (*http.Response, error) {
	if !setting.EnableWorker() {
		return nil, fmt.Errorf("worker not enabled")
	}
	if !setting.WorkerAllowHttpImageRequestEnabled && !strings.HasPrefix(req.URL, "https") {
		return nil, fmt.Errorf("only support https url")
	}

	workerUrl := setting.WorkerUrl
	if !strings.HasSuffix(workerUrl, "/") {
		workerUrl += "/"
	}

	// 序列化worker请求数据
	workerPayload, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal worker payload: %v", err)
	}

	return http.Post(workerUrl, "application/json", bytes.NewBuffer(workerPayload))
}

func DoDownloadRequest(originUrl string) (resp *http.Response, err error) {
	imagReadProxy := operation_setting.GetImageReadProxy()
	if setting.EnableWorker() {
		common.SysLog(fmt.Sprintf("downloading file from worker: %s", originUrl))
		req := &WorkerRequest{
			URL: originUrl,
			Key: setting.WorkerValidKey,
		}
		return DoWorkerRequest(req)
	}

	if imagReadProxy != "" {
		common.SysLog(fmt.Sprintf("downloading through proxy: %s, url: %s", imagReadProxy, originUrl))

		// 获取或创建代理客户端
		client, err := getProxyClient(imagReadProxy)
		if err != nil {
			common.SysLog(fmt.Sprintf("proxy client creation failed: %v, fallback to direct request", err))
			return http.Get(originUrl)
		}

		// 使用代理发起请求
		resp, err := client.Get(originUrl)
		if err != nil {
			common.SysLog(fmt.Sprintf("proxy request failed: %v, fallback to direct request", err))
			return http.Get(originUrl)
		}
		return resp, nil
	} else {
		common.SysLog(fmt.Sprintf("downloading from origin: %s", originUrl))
		return http.Get(originUrl)
	}
}
