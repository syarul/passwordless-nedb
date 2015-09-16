REPORTER = spec
test:
	@NODE_ENV=test gulp && cat ./coverage/lcov.info | ./node_modules/coveralls/bin/coveralls.js \
	&& rm -rf ./coverage

.PHONY: test