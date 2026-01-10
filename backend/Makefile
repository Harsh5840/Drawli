.PHONY: proto build run

proto:
	protoc --go_out=internal --go_opt=paths=source_relative proto/messages.proto

build:
	go build -o bin/server.exe ./cmd/server

run: build
	./bin/server.exe
