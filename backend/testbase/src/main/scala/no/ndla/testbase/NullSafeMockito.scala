/*
 * Part of NDLA testbase
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.testbase

import org.mockito.stubbing.{Answer, OngoingStubbing, Stubber}
import org.mockito.verification.VerificationMode
import org.mockito.{ArgumentCaptor, ArgumentMatchers, MockSettings, MockingDetails, Mockito}

/** Mockito entry points typed without `| Null`. Matchers and captors return `null` at runtime while registering
  * themselves with Mockito, so those are cast instead of checked with `.nn`.
  */
object NullSafeMockito {
  final class NullSafeStubber(stubber: Stubber) {
    def when[T](mock: T): T = stubber.when(mock).nn
  }

  def when[T](methodCall: T): OngoingStubbing[T]                           = Mockito.when(methodCall).nn
  def verify[T](mock: T): T                                                = Mockito.verify(mock).nn
  def verify[T](mock: T, mode: VerificationMode): T                        = Mockito.verify(mock, mode).nn
  def times(wantedNumberOfInvocations: Int): VerificationMode              = Mockito.times(wantedNumberOfInvocations).nn
  def never: VerificationMode                                              = Mockito.never().nn
  def atLeastOnce: VerificationMode                                        = Mockito.atLeastOnce().nn
  def reset[T](mocks: T*): Unit                                            = Mockito.reset(mocks*)
  def verifyNoMoreInteractions(mocks: Any*): Unit                          = Mockito.verifyNoMoreInteractions(mocks*)
  def spy[T](obj: T): T                                                    = Mockito.spy(obj).nn
  def mockingDetails(toInspect: Any): MockingDetails                       = Mockito.mockingDetails(toInspect).nn
  def withSettings: MockSettings                                           = Mockito.withSettings().nn
  def doReturn(toBeReturned: Any): NullSafeStubber                         = NullSafeStubber(Mockito.doReturn(toBeReturned).nn)
  def doReturn(toBeReturned: Any, toBeReturnedNext: Any*): NullSafeStubber =
    NullSafeStubber(Mockito.doReturn(toBeReturned, toBeReturnedNext*).nn)
  def doAnswer(answer: Answer[?]): NullSafeStubber = NullSafeStubber(Mockito.doAnswer(answer).nn)
  def doNothing(): NullSafeStubber                 = NullSafeStubber(Mockito.doNothing().nn)

  def any[T]: T                                = ArgumentMatchers.any[T]().asInstanceOf[T]
  def eqTo[T](value: T): T                     = ArgumentMatchers.eq(value).asInstanceOf[T]
  def anyString: String                        = ArgumentMatchers.anyString().nn
  def anyInt: Int                              = ArgumentMatchers.anyInt()
  def capture[T](captor: ArgumentCaptor[T]): T = captor.capture().asInstanceOf[T]
}
