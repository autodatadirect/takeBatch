import { spawn, fork, take, race } from 'redux-saga/effects'
import { delay as delayFunc } from 'redux-saga'

export default function * (delay, pattern, callback) {
  if (!delay || !pattern || !callback) throw new Error('missing required field: delay, pattern, or callback')
  const initialState = { buffer: [], end: end(delay) }
  yield takeEvery(pattern, batch, callback, initialState, delay)
}

function * batch (callback, state, delay, action) {
  if (action) state.buffer.push(action)
  if (isBatchComplete(state)) {
    const buffer = [...state.buffer]
    state.buffer = []
    state.end = end(delay)
    yield spawn(callback, buffer)
  }
}

const takeEvery = (patternOrChannel, saga, callback, state, delay) => fork(function * () {
  while (true) {
    const {action} = yield race({
      action: take(patternOrChannel),
      timeout: delayFunc(state.end - now())
    })
    yield fork(saga, callback, state, delay, action)
  }
})

const isBatchComplete = state => now() > state.end

const now = () => (new Date()).valueOf()

const end = delay => now() + delay
