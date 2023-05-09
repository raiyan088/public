"use strict";
/**
 * Copyright 2017 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var _ExecutionContext_instances, _ExecutionContext_bindingsInstalled, _ExecutionContext_puppeteerUtil, _ExecutionContext_installGlobalBinding, _ExecutionContext_evaluate;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutionContext = exports.EVALUATION_SCRIPT_URL = void 0;
const AsyncIterableUtil_js_1 = require("../util/AsyncIterableUtil.js");
const Function_js_1 = require("../util/Function.js");
const AriaQueryHandler_js_1 = require("./AriaQueryHandler.js");
const Binding_js_1 = require("./Binding.js");
const ElementHandle_js_1 = require("./ElementHandle.js");
const JSHandle_js_1 = require("./JSHandle.js");
const LazyArg_js_1 = require("./LazyArg.js");
const ScriptInjector_js_1 = require("./ScriptInjector.js");
const util_js_1 = require("./util.js");
/**
 * @public
 */
exports.EVALUATION_SCRIPT_URL = 'pptr://__puppeteer_evaluation_script__';
const SOURCE_URL_REGEX = /^[\040\t]*\/\/[@#] sourceURL=\s*(\S*?)\s*$/m;
/**
 * Represents a context for JavaScript execution.
 *
 * @example
 * A {@link Page} can have several execution contexts:
 *
 * - Each {@link Frame} of a {@link Page | page} has a "default" execution
 *   context that is always created after frame is attached to DOM. This context
 *   is returned by the {@link Frame.executionContext} method.
 * - Each {@link https://developer.chrome.com/extensions | Chrome extensions}
 *   creates additional execution contexts to isolate their code.
 *
 * @remarks
 * By definition, each context is isolated from one another, however they are
 * all able to manipulate non-JavaScript resources (such as DOM).
 *
 * @remarks
 * Besides pages, execution contexts can be found in
 * {@link WebWorker | workers}.
 *
 * @internal
 */
class ExecutionContext {
    constructor(client, contextPayload, world) {
        _ExecutionContext_instances.add(this);
        _ExecutionContext_bindingsInstalled.set(this, false);
        _ExecutionContext_puppeteerUtil.set(this, void 0);
        this._client = client;
        this._world = world;
        this._contextId = contextPayload.id;
        if (contextPayload.name) {
            this._contextName = contextPayload.name;
        }
    }
    get puppeteerUtil() {
        let promise = Promise.resolve();
        if (!__classPrivateFieldGet(this, _ExecutionContext_bindingsInstalled, "f")) {
            promise = Promise.all([
                __classPrivateFieldGet(this, _ExecutionContext_instances, "m", _ExecutionContext_installGlobalBinding).call(this, new Binding_js_1.Binding('__ariaQuerySelector', AriaQueryHandler_js_1.ARIAQueryHandler.queryOne)),
                __classPrivateFieldGet(this, _ExecutionContext_instances, "m", _ExecutionContext_installGlobalBinding).call(this, new Binding_js_1.Binding('__ariaQuerySelectorAll', (async (element, selector) => {
                    const results = AriaQueryHandler_js_1.ARIAQueryHandler.queryAll(element, selector);
                    return element.executionContext().evaluateHandle((...elements) => {
                        return elements;
                    }, ...(await AsyncIterableUtil_js_1.AsyncIterableUtil.collect(results)));
                }))),
            ]);
            __classPrivateFieldSet(this, _ExecutionContext_bindingsInstalled, true, "f");
        }
        ScriptInjector_js_1.scriptInjector.inject(script => {
            if (__classPrivateFieldGet(this, _ExecutionContext_puppeteerUtil, "f")) {
                void __classPrivateFieldGet(this, _ExecutionContext_puppeteerUtil, "f").then(handle => {
                    void handle.dispose();
                });
            }
            __classPrivateFieldSet(this, _ExecutionContext_puppeteerUtil, promise.then(() => {
                return this.evaluateHandle(script);
            }), "f");
        }, !__classPrivateFieldGet(this, _ExecutionContext_puppeteerUtil, "f"));
        return __classPrivateFieldGet(this, _ExecutionContext_puppeteerUtil, "f");
    }
    /**
     * Evaluates the given function.
     *
     * @example
     *
     * ```ts
     * const executionContext = await page.mainFrame().executionContext();
     * const result = await executionContext.evaluate(() => Promise.resolve(8 * 7))* ;
     * console.log(result); // prints "56"
     * ```
     *
     * @example
     * A string can also be passed in instead of a function:
     *
     * ```ts
     * console.log(await executionContext.evaluate('1 + 2')); // prints "3"
     * ```
     *
     * @example
     * Handles can also be passed as `args`. They resolve to their referenced object:
     *
     * ```ts
     * const oneHandle = await executionContext.evaluateHandle(() => 1);
     * const twoHandle = await executionContext.evaluateHandle(() => 2);
     * const result = await executionContext.evaluate(
     *   (a, b) => a + b,
     *   oneHandle,
     *   twoHandle
     * );
     * await oneHandle.dispose();
     * await twoHandle.dispose();
     * console.log(result); // prints '3'.
     * ```
     *
     * @param pageFunction - The function to evaluate.
     * @param args - Additional arguments to pass into the function.
     * @returns The result of evaluating the function. If the result is an object,
     * a vanilla object containing the serializable properties of the result is
     * returned.
     */
    async evaluate(pageFunction, ...args) {
        return await __classPrivateFieldGet(this, _ExecutionContext_instances, "m", _ExecutionContext_evaluate).call(this, true, pageFunction, ...args);
    }
    /**
     * Evaluates the given function.
     *
     * Unlike {@link ExecutionContext.evaluate | evaluate}, this method returns a
     * handle to the result of the function.
     *
     * This method may be better suited if the object cannot be serialized (e.g.
     * `Map`) and requires further manipulation.
     *
     * @example
     *
     * ```ts
     * const context = await page.mainFrame().executionContext();
     * const handle: JSHandle<typeof globalThis> = await context.evaluateHandle(
     *   () => Promise.resolve(self)
     * );
     * ```
     *
     * @example
     * A string can also be passed in instead of a function.
     *
     * ```ts
     * const handle: JSHandle<number> = await context.evaluateHandle('1 + 2');
     * ```
     *
     * @example
     * Handles can also be passed as `args`. They resolve to their referenced object:
     *
     * ```ts
     * const bodyHandle: ElementHandle<HTMLBodyElement> =
     *   await context.evaluateHandle(() => {
     *     return document.body;
     *   });
     * const stringHandle: JSHandle<string> = await context.evaluateHandle(
     *   body => body.innerHTML,
     *   body
     * );
     * console.log(await stringHandle.jsonValue()); // prints body's innerHTML
     * // Always dispose your garbage! :)
     * await bodyHandle.dispose();
     * await stringHandle.dispose();
     * ```
     *
     * @param pageFunction - The function to evaluate.
     * @param args - Additional arguments to pass into the function.
     * @returns A {@link JSHandle | handle} to the result of evaluating the
     * function. If the result is a `Node`, then this will return an
     * {@link ElementHandle | element handle}.
     */
    async evaluateHandle(pageFunction, ...args) {
        return __classPrivateFieldGet(this, _ExecutionContext_instances, "m", _ExecutionContext_evaluate).call(this, false, pageFunction, ...args);
    }
}
exports.ExecutionContext = ExecutionContext;
_ExecutionContext_bindingsInstalled = new WeakMap(), _ExecutionContext_puppeteerUtil = new WeakMap(), _ExecutionContext_instances = new WeakSet(), _ExecutionContext_installGlobalBinding = async function _ExecutionContext_installGlobalBinding(binding) {
    try {
        if (this._world) {
            this._world._bindings.set(binding.name, binding);
            await this._world._addBindingToContext(this, binding.name);
        }
    }
    catch {
        // If the binding cannot be added, then either the browser doesn't support
        // bindings (e.g. Firefox) or the context is broken. Either breakage is
        // okay, so we ignore the error.
    }
}, _ExecutionContext_evaluate = async function _ExecutionContext_evaluate(returnByValue, pageFunction, ...args) {
    const suffix = `//# sourceURL=${exports.EVALUATION_SCRIPT_URL}`;
    if ((0, util_js_1.isString)(pageFunction)) {
        const contextId = this._contextId;
        const expression = pageFunction;
        const expressionWithSourceUrl = SOURCE_URL_REGEX.test(expression)
            ? expression
            : expression + '\n' + suffix;
        const { exceptionDetails, result: remoteObject } = await this._client
            .send('Runtime.evaluate', {
            expression: expressionWithSourceUrl,
            contextId,
            returnByValue,
            awaitPromise: true,
            userGesture: true,
        })
            .catch(rewriteError);
        if (exceptionDetails) {
            throw new Error('Evaluation failed: ' + (0, util_js_1.getExceptionMessage)(exceptionDetails));
        }
        return returnByValue
            ? (0, util_js_1.valueFromRemoteObject)(remoteObject)
            : (0, util_js_1.createJSHandle)(this, remoteObject);
    }
    let callFunctionOnPromise;
    try {
        callFunctionOnPromise = this._client.send('Runtime.callFunctionOn', {
            functionDeclaration: `${(0, Function_js_1.stringifyFunction)(pageFunction)}\n${suffix}\n`,
            executionContextId: this._contextId,
            arguments: await Promise.all(args.map(convertArgument.bind(this))),
            returnByValue,
            awaitPromise: true,
            userGesture: true,
        });
    }
    catch (error) {
        if (error instanceof TypeError &&
            error.message.startsWith('Converting circular structure to JSON')) {
            error.message += ' Recursive objects are not allowed.';
        }
        throw error;
    }
    const { exceptionDetails, result: remoteObject } = await callFunctionOnPromise.catch(rewriteError);
    if (exceptionDetails) {
        throw new Error('Evaluation failed: ' + (0, util_js_1.getExceptionMessage)(exceptionDetails));
    }
    return returnByValue
        ? (0, util_js_1.valueFromRemoteObject)(remoteObject)
        : (0, util_js_1.createJSHandle)(this, remoteObject);
    async function convertArgument(arg) {
        if (arg instanceof LazyArg_js_1.LazyArg) {
            arg = await arg.get(this);
        }
        if (typeof arg === 'bigint') {
            // eslint-disable-line valid-typeof
            return { unserializableValue: `${arg.toString()}n` };
        }
        if (Object.is(arg, -0)) {
            return { unserializableValue: '-0' };
        }
        if (Object.is(arg, Infinity)) {
            return { unserializableValue: 'Infinity' };
        }
        if (Object.is(arg, -Infinity)) {
            return { unserializableValue: '-Infinity' };
        }
        if (Object.is(arg, NaN)) {
            return { unserializableValue: 'NaN' };
        }
        const objectHandle = arg && (arg instanceof JSHandle_js_1.CDPJSHandle || arg instanceof ElementHandle_js_1.CDPElementHandle)
            ? arg
            : null;
        if (objectHandle) {
            if (objectHandle.executionContext() !== this) {
                throw new Error('JSHandles can be evaluated only in the context they were created!');
            }
            if (objectHandle.disposed) {
                throw new Error('JSHandle is disposed!');
            }
            if (objectHandle.remoteObject().unserializableValue) {
                return {
                    unserializableValue: objectHandle.remoteObject().unserializableValue,
                };
            }
            if (!objectHandle.remoteObject().objectId) {
                return { value: objectHandle.remoteObject().value };
            }
            return { objectId: objectHandle.remoteObject().objectId };
        }
        return { value: arg };
    }
};
const rewriteError = (error) => {
    if (error.message.includes('Object reference chain is too long')) {
        return { result: { type: 'undefined' } };
    }
    if (error.message.includes("Object couldn't be returned by value")) {
        return { result: { type: 'undefined' } };
    }
    throw error;
};
//# sourceMappingURL=ExecutionContext.js.map