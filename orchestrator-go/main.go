// Pied Piper system orchestrator (pipeline stage 1): reads raw text from
// stdin and emits a traced CompressionJob to stdout.
package main

import (
	"crypto/rand"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"strings"
	"time"
)

const serviceName = "orchestrator-go"

type CompressionJob struct {
	RequestID     string `json:"request_id"`
	SourceService string `json:"source_service"`
	Payload       string `json:"payload"`
}

type errorBody struct {
	Code          string `json:"code"`
	Message       string `json:"message"`
	SourceService string `json:"source_service"`
	RequestID     string `json:"request_id"`
}

type errorEnvelope struct {
	Error errorBody `json:"error"`
}

func logLine(level string, message string) {
	timestamp := time.Now().UTC().Format("2006-01-02T15:04:05Z")
	fmt.Fprintf(os.Stderr, "[%s] [%s] [%s] %s\n", timestamp, serviceName, level, message)
}

func emitError(code string, message string, requestID string) {
	logLine("ERROR", fmt.Sprintf("%s: %s", code, message))
	envelope := errorEnvelope{Error: errorBody{
		Code:          code,
		Message:       message,
		SourceService: serviceName,
		RequestID:     requestID,
	}}
	out, err := json.Marshal(envelope)
	if err != nil {
		// A flat struct of strings cannot fail to marshal; keep the contract anyway.
		out = []byte(`{"error":{"code":"PP_INTERNAL","message":"error envelope encoding failed","source_service":"orchestrator-go","request_id":""}}`)
	}
	fmt.Println(string(out))
	os.Exit(1)
}

func newRequestID() (string, error) {
	var b [16]byte
	if _, err := rand.Read(b[:]); err != nil {
		return "", err
	}
	b[6] = (b[6] & 0x0f) | 0x40 // version 4
	b[8] = (b[8] & 0x3f) | 0x80 // variant 10
	return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:16]), nil
}

func main() {
	defer func() {
		if r := recover(); r != nil {
			emitError("PP_INTERNAL", fmt.Sprintf("unexpected panic: %v", r), "")
		}
	}()

	raw, err := io.ReadAll(os.Stdin)
	if err != nil {
		emitError("PP_INTERNAL", "could not read stdin: "+err.Error(), "")
	}
	payload := strings.TrimSpace(string(raw))
	if payload == "" {
		emitError("PP_EMPTY_INPUT", "stdin is empty or whitespace-only", "")
	}

	requestID, err := newRequestID()
	if err != nil {
		emitError("PP_INTERNAL", "could not generate request_id: "+err.Error(), "")
	}
	logLine("INFO", fmt.Sprintf("accepted job %s (%d bytes)", requestID, len(payload)))

	job := CompressionJob{RequestID: requestID, SourceService: serviceName, Payload: payload}
	out, err := json.Marshal(job)
	if err != nil {
		emitError("PP_INTERNAL", "could not marshal job: "+err.Error(), requestID)
	}
	fmt.Println(string(out))
	logLine("INFO", fmt.Sprintf("emitted job %s", requestID))
}
