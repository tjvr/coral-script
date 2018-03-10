name=coral-storage
registry=docker.tjvr.org
sha1=$(shell git rev-parse --short HEAD)

image:
	docker build -t $(name) .
	docker tag $(name) $(registry)/$(name):$(sha1)

deploy:
	docker push $(registry)/$(name):$(sha1)
	kubectl set image deploy/$(name) $(name)=$(registry)/$(name):$(sha1)
	kubectl rollout status deploy/$(name)

.PHONY: image deploy
