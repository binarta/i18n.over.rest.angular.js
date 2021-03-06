angular.module('config', []);

describe('i18n.rest', function () {
    var $httpBackend, topics, http;
    var config;

    beforeEach(function () {
        config = {};
        module(function ($provide) {
            $provide.value('config', config);
        });
    });

    beforeEach(module('i18n.over.rest'));
    beforeEach(module('rest.client'));
    beforeEach(module('notifications'));
    beforeEach(inject(function ($injector, topicRegistryMock, $http) {
        $httpBackend = $injector.get('$httpBackend');
        topics = topicRegistryMock;
        http = $http;
    }));
    afterEach(function () {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    describe('reader', function () {
        var reader;
        var namespace = 'namespace';
        var code = 'translation.code';
        var translation = 'translation message';
        var defaultTranslation = 'default translation';
        var receivedTranslation;
        var receivedError;
        var onSuccess = function (translation) {
            receivedTranslation = translation;
        };
        var onError = function () {
            receivedError = true;
        };
        var context;

        beforeEach(inject(function (iorMessageReader) {
            reader = iorMessageReader;
            receivedTranslation = '';
            receivedError = false;
            context = {};
        }));

        function testHttpCallsWithPrefix(prefix) {
            it('on execute perform GET request with the code', function () {
                $httpBackend.expect('GET', prefix + 'api/i18n/translate?key=' + encodeURIComponent(code)).respond(200);
                context.code = code;
                reader(context);
                $httpBackend.flush();
            });
            it('on execute perform GET request with the code and namespace', function () {
                $httpBackend.expect('GET', prefix + 'api/i18n/translate?namespace=' + namespace + '&key=' + encodeURIComponent(code)).respond(200);
                context.namespace = namespace;
                context.code = code;
                reader(context);
                $httpBackend.flush();
            });
            it('pass translation to on success handler', function () {
                $httpBackend.when('GET', /.*/).respond(200, translation);
                reader(context, onSuccess);
                $httpBackend.flush();
                expect(receivedTranslation).toEqual(translation);
            });
            it('on error trigger on error handler', function () {
                $httpBackend.when('GET', /.*/).respond(404);
                context.default = defaultTranslation;
                reader(context, onSuccess, onError);
                $httpBackend.flush();
                expect(receivedError).toEqual(true);
            });

            it('test', function() {
                context.locale = 'L';
                $httpBackend.expect('GET', /.*/, /.*/, function(headers) {
                    if (headers['Accept-Language'] == context.locale) return true;
                }).respond(200, translation);
                reader(context, onSuccess, onError);
                $httpBackend.flush();
            })
        }

        testHttpCallsWithPrefix('');
        describe('with config.initialized notification received', function () {
            beforeEach(function () {
                config.baseUri = 'http://host/context/';
            });

            testHttpCallsWithPrefix('http://host/context/');
        });

        describe('with config.initialized notification received without baseUri', function () {
            testHttpCallsWithPrefix('');
        });

        describe('code should be uri encoded', function () {
            beforeEach(function () {
                code = 'Foo & Bar';
            });

            testHttpCallsWithPrefix('');
        });
    });

    describe('writer', function () {
        var writer;
        var code = 'translation.code';
        var translation = 'translation message';
        var namespace = 'namespace';
        var locale = 'locale';
        var receivedSuccess;
        var receivedError;
        var receivedStatus;
        var receivedBody;
        var onSuccess = function () {
            receivedSuccess = true;
        };
        var onError = function (body, status) {
            receivedError = true;
            receivedStatus = status;
            receivedBody = body;
        };
        var context;
        var rest;
        var presenter;

        beforeEach(inject(function (iorMessageWriter, restServiceHandler) {
            rest = restServiceHandler;
            writer = iorMessageWriter;
            receivedSuccess = false;
            receivedError = false;
            context = {};
            presenter = {
                success:onSuccess
            };
        }));

        function expectRestCallFor(ctx) {
            expect(rest.calls.first().args[0].params).toEqual(ctx);
        }

        describe('given required context fields', function() {
            var key;

            beforeEach(function() {
                context.key = code;
                context.message = translation;
                key = 'api/i18n/translate?key=' + code;
            });

            describe('on execute', function() {
                beforeEach(function() {
                    writer(context, presenter);
                });

                it('performs rest call', function() {
                    expectRestCallFor({
                        method:'POST',
                        url:'api/i18n/translate',
                        data:{locale: undefined, key: code, message: translation},
                        withCredentials:true
                    });
                });
            });

            describe('and optional context fields', function() {

                beforeEach(function() {
                    context.namespace = namespace;
                    context.locale = locale;
                    key = 'api/i18n/translate?namespace=' + namespace + '&key=' + code;
                });

                describe('on execute', function() {
                    beforeEach(function() {
                        writer(context, presenter);
                    });

                    it('performs rest call', function() {
                        expectRestCallFor({
                            method:'POST',
                            url:'api/i18n/translate',
                            data:{key: code, message: translation, namespace:namespace, locale: locale},
                            withCredentials:true,
                            headers: {
                                'accept-language': locale
                            }
                        });
                    });
                });
            });
        });

        function testHttpCallsWithPrefix(prefix) {
            it('on execute', function () {
                context.key = code;
                context.message = translation;
                writer(context, {
                    success:onSuccess,
                    error:onError
                });
                expectRestCallFor({
                    method:'POST',
                    url:prefix + 'api/i18n/translate',
                    data:{locale: undefined, key: code, message: translation},
                    withCredentials:true
                });
            });
        }

        testHttpCallsWithPrefix('');
        describe('with baseuri', function () {
            beforeEach(function () {
                config.baseUri = 'http://host/context/';
            });

            testHttpCallsWithPrefix('http://host/context/');
        });

        describe('without baseUri', function () {
            testHttpCallsWithPrefix('');
        });
    });
});