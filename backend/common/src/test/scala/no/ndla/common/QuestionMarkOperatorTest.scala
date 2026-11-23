/*
 * Part of NDLA common
 * Copyright (C) 2024 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.common

import no.ndla.common.implicits._
import no.ndla.testbase.UnitTestSuiteBase

import scala.util.control.NonFatal
import scala.util.{Failure, Success, Try, Using}

class QuestionMarkOperatorTest extends UnitTestSuiteBase {

  val testException              = new RuntimeException("Bad method")
  def failingMethod: Try[Int]    = Failure(testException)
  def succeedingMethod: Try[Int] = Success(1)

  def someMethod: Option[Int] = Some(1)
  def noneMethod: Option[Int] = None

  test("That question mark operator works on success for try methods") {
    def tryMethod(): Try[String] = permitTry {
      val someData = succeedingMethod.?
      Success(someData.toString)
    }
    tryMethod() should be(Success("1"))
  }

  test("That question mark operator works on failure for try methods") {
    def tryMethod(): Try[String] = permitTry {
      val someData = failingMethod.?
      Success(someData.toString)
    }
    tryMethod() should be(Failure(testException))
  }

  test("That question mark operator is not caught by Using, and the resource is still released") {
    var released                = false
    val resource: AutoCloseable = () => released = true

    def tryMethod(): Try[Int] = permitTry {
      Using(resource) { _ =>
        failingMethod.?
      }
    }
    tryMethod() should be(Failure(testException))
    released should be(true)
  }

  test("That question mark operator is not caught by Try") {
    def tryMethod(): Try[Int] = permitTry {
      Try(failingMethod.?)
    }
    tryMethod() should be(Failure(testException))
  }

  test("That question mark operator is not caught by NonFatal handlers") {
    def tryMethod(): Try[Int] = permitTry {
      try Success(failingMethod.?)
      catch {
        case NonFatal(ex) => Failure(new RuntimeException("caught", ex))
      }
    }
    tryMethod() should be(Failure(testException))
  }

//  test("That question mark operator works on some for option methods") {
//    def optMethod(): Option[String] = permitTry {
//      val someData = someMethod.?
//      Some(someData.toString)
//    }
//    optMethod() should be(Some("1"))
//  }
//
//  test("That question mark operator works on none for option methods") {
//    def optMethod(): Option[String] = permitTry {
//      val someData = noneMethod.?
//      Some(someData.toString)
//    }
//    optMethod() should be(None)
//  }

}
