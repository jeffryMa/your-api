// common/event/event_bus.go
package event

import (
	"sync"
)

// EventType 定义事件类型
type EventType string

const (
	ModelDescriptionsUpdated EventType = "model_descriptions_updated"
)

// EventHandler 事件处理
type EventHandler func(data interface{})

// EventBus 事件总线
type eventBus struct {
	handlers map[EventType][]EventHandler
	mutex    sync.RWMutex
}

var (
	// 全局事件总线实例
	globalBus = &eventBus{
		handlers: make(map[EventType][]EventHandler),
	}
)

// Subscribe 订阅事件
func Subscribe(eventType EventType, handler EventHandler) {
	globalBus.mutex.Lock()
	defer globalBus.mutex.Unlock()

	handlers := globalBus.handlers[eventType]
	globalBus.handlers[eventType] = append(handlers, handler)
}

// Publish 发布事件
func Publish(eventType EventType, data interface{}) {
	globalBus.mutex.RLock()
	handlers := globalBus.handlers[eventType]
	globalBus.mutex.RUnlock()

	// 异步执行所有处理函数
	for _, handler := range handlers {
		go handler(data)
	}
}
