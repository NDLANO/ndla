/*
 * Part of NDLA database
 * Copyright (C) 2025 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.database

import no.ndla.database.implicits.*
import no.ndla.scalatestsuite.{DatabaseIntegrationSuite, UnitTestSuite}
import scalikejdbc.*

import java.util.UUID
import scala.util.{Failure, Success}

class TrySqlTest extends DatabaseIntegrationSuite, UnitTestSuite, TestEnvironment {
  override lazy val schemaName: String = s"trysqltest_${ProcessHandle.current().nn.pid()}"
  val dataSource: DataSource           = testDataSource.get

  private val someUuid = UUID.fromString("6e0a4d1c-6f1e-4b8a-9c3f-2f5b1a7d9e10")

  override def beforeAll(): Unit = {
    super.beforeAll()

    dataSource.connectToDatabase()

    val schemaSql = SQLSyntax.createUnsafely(schemaName)
    DB.autoCommit { implicit session =>
      sql"""
            create schema if not exists $schemaSql;
            create table if not exists test (id int primary key, data text);
            create table if not exists test2 (id int primary key, data text, parent int not null references test(id));
            create table if not exists test3 (id int primary key, data text, parent int not null references test(id));
            create table if not exists test4 (id int primary key, data text, parent int not null references test(id));
            create table if not exists nullable (id int primary key, num int, txt text, uid uuid, arr text[]);"""
        .execute()
    }
  }

  override def beforeEach(): Unit = {
    super.beforeEach()

    DB.autoCommit { implicit session =>
      sql"""
            delete from nullable;
            delete from test4;
            delete from test3;
            delete from test2;
            delete from test;

            insert into test (id, data) values (1, 'parent1');
            insert into test (id, data) values (2, 'parent2');
            insert into test (id, data) values (3, 'parent3');

            insert into test2 (id, data, parent) values (1, 'child1_of_parent1', 1);

            insert into test2 (id, data, parent) values (2, 'child1_of_parent2', 2);
            insert into test2 (id, data, parent) values (3, 'child2_of_parent2', 2);
            insert into test2 (id, data, parent) values (4, 'child3_of_parent2', 2);

            insert into test3 (id, data, parent) values (1, 'child1_of_parent1', 1);

            insert into test4 (id, data, parent) values (1, 'child1_of_parent1', 1);

            insert into nullable (id, num, txt, uid, arr) values (1, 42, 'not json', '6e0a4d1c-6f1e-4b8a-9c3f-2f5b1a7d9e10', '{a,NULL,b}');
            insert into nullable (id, num, txt, uid, arr) values (2, null, null, null, null);""".execute()
    }
  }

  test("that execute, update, and updateAndReturnGeneratedKey works") {
    dbUtil.writeSession { implicit session =>
      tsql"insert into test (id, data) values (42, 'example')".execute().failIfFailure

      tsql"insert into test (id, data) values (43, 'example')".update().failIfFailure should be(1)

      val generatedKey =
        tsql"insert into test (id, data) values (44, 'example')".updateAndReturnGeneratedKey().failIfFailure
      generatedKey should be(44)
    }
  }

  test("that runSingle and runSingleTry works") {
    dbUtil.writeSession { implicit session =>
      val res1 = tsql"select * from test where id = 1".map(_.string("data")).runSingle().failIfFailure
      res1 should be(Some("parent1"))

      val expectedException = new RuntimeException("No data found!")
      val res2              = tsql"select * from test where data = 'this does not exist'"
        .map(_.string("data"))
        .runSingleTry(expectedException)
      res2 should be(Failure(expectedException))
    }
  }

  test("that runList and runListFlat works") {
    dbUtil.writeSession { implicit session =>
      val res1 = tsql"select * from test where id = 1".map(_.string("data")).runList().failIfFailure
      res1 should be(List("parent1"))

      val expectedException = new RuntimeException("Something went wrong!")
      val res2              = tsql"select * from test".map(_ => Failure(expectedException)).runListFlat()
      res2 should be(Failure(expectedException))
    }
  }

  test("that required columns decode values, and fail with the column name when NULL") {
    dbUtil.writeSession { implicit session =>
      val present = tsql"select * from nullable where id = 1"
        .decode(row =>
          for {
            num <- row.required[Int]("num")
            txt <- row.required[String]("txt")
            uid <- row.required[UUID]("uid")
          } yield (num, txt, uid)
        )
        .runSingle()
      present should be(Success(Some((42, "not json", someUuid))))

      tsql"select * from nullable where id = 2".decode(_.required[Int]("num")).runSingle() should
        be(Failure(UnexpectedNullColumnException("num")))
      tsql"select * from nullable where id = 2".decode(_.required[UUID]("uid")).runSingle() should
        be(Failure(UnexpectedNullColumnException("uid")))
    }
  }

  test("that optional columns are None when NULL, also for primitive columns") {
    dbUtil.writeSession { implicit session =>
      val res = tsql"select * from nullable order by id"
        .decode(row =>
          for {
            num <- row.optional[Int]("num")
            uid <- row.optional[UUID]("uid")
          } yield (num, uid)
        )
        .runList()
      res should be(Success(List((Some(42), Some(someUuid)), (None, None))))
    }
  }

  test("that text arrays are decoded with NULL elements as None") {
    dbUtil.writeSession { implicit session =>
      tsql"select * from nullable order by id".decode(_.optional[List[Option[String]]]("arr")).runList() should
        be(Success(List(Some(List(Some("a"), None, Some("b"))), None)))
    }
  }

  test("that a value that cannot be decoded fails, even if the column is optional") {
    dbUtil.writeSession { implicit session =>
      val res = tsql"select * from nullable where id = 1"
        .decode(_.optional[Map[String, Int]]("txt")(using ColumnDecoder.json))
        .runSingle()

      res.failed.get shouldBe a[ColumnDecodeException]
      res.failed.get.asInstanceOf[ColumnDecodeException].column should be("txt")
    }
  }

  test("that a single row failing to decode fails the whole list") {
    dbUtil.writeSession { implicit session =>
      tsql"select * from nullable order by id".decode(_.required[Int]("num")).runList() should
        be(Failure(UnexpectedNullColumnException("num")))
    }
  }

  test("that .one(..).toOne(..) works") {
    dbUtil.writeSession { implicit session =>
      val res =
        tsql"select t.data as t_data, t2.data as t2_data from test t inner join test2 t2 on t2.parent = t.id where t.id = 1"
          .one(_.required[String]("t_data"))
          .toOne(_.required[String]("t2_data"))
          .map((parent, child) => parent -> child)
          .runList()
          .failIfFailure

      res should be(List("parent1" -> "child1_of_parent1"))
    }
  }

  test("that .one(..).toOptionalOne(..) is None when the joined row is missing") {
    dbUtil.writeSession { implicit session =>
      val res = tsql"""
               select t.data as t_data, t3.id as t3_id, t3.data as t3_data from test t
               left join test3 t3 on t3.parent = t.id
               where t.id in (1, 3)
               order by t.id"""
        .one(_.required[String]("t_data"))
        .toOptionalOne(OptionalRow.presentWhen("t3_id")(_.required[String]("t3_data")))
        .map((parent, child) => parent -> child)
        .runList()
        .failIfFailure

      res should be(List("parent1" -> Some("child1_of_parent1"), "parent3" -> None))
    }
  }

  test("that .one(..).toMany(..) works") {
    dbUtil.writeSession { implicit session =>
      val res = tsql"""
               select t.data as t_data, t2.id as t2_id, t2.data as t2_data from test t
               inner join test2 t2 on t2.parent = t.id
               where t.id = 2"""
        .one(_.required[String]("t_data"))
        .toMany(OptionalRow.presentWhen("t2_id")(_.required[String]("t2_data")))
        .map((parent, children) => parent -> children)
        .runList()
        .failIfFailure

      res should be(List("parent2" -> List("child1_of_parent2", "child2_of_parent2", "child3_of_parent2")))
    }
  }

  test("that .one(..).toMany(..) gives no children when the joined row is missing") {
    dbUtil.writeSession { implicit session =>
      val res = tsql"""
               select t.data as t_data, t2.id as t2_id, t2.data as t2_data from test t
               left join test2 t2 on t2.parent = t.id
               where t.id = 3"""
        .one(_.required[String]("t_data"))
        .toMany(OptionalRow.presentWhen("t2_id")(_.required[String]("t2_data")))
        .map((parent, children) => parent -> children)
        .runList()

      res should be(Success(List("parent3" -> List.empty)))
    }
  }

  test("that .one(..).toMany(..) fails when a joined row is present but fails to decode") {
    dbUtil.writeSession { implicit session =>
      tsql"insert into test2 (id, data, parent) values (5, null, 3)".execute().failIfFailure

      val res = tsql"""
               select t.data as t_data, t2.id as t2_id, t2.data as t2_data from test t
               left join test2 t2 on t2.parent = t.id
               where t.id = 3"""
        .one(_.required[String]("t_data"))
        .toMany(OptionalRow.presentWhen("t2_id")(_.required[String]("t2_data")))
        .map((parent, children) => parent -> children)
        .runList()

      res should be(Failure(UnexpectedNullColumnException("t2_data")))
    }
  }

  test("that .one(..).toManies(..) with three arguments works") {
    dbUtil.writeSession { implicit session =>
      val res = tsql"""
               select t.data as t_data, t2.id as t2_id, t2.data as t2_data, t3.id as t3_id, t3.data as t3_data,
                      t4.id as t4_id, t4.data as t4_data
               from test t
               inner join test2 t2 on t2.parent = t.id
               inner join test3 t3 on t3.parent = t.id
               inner join test4 t4 on t4.parent = t.id"""
        .one(_.required[String]("t_data"))
        .toManies(
          OptionalRow.presentWhen("t2_id")(_.required[String]("t2_data")),
          OptionalRow.presentWhen("t3_id")(_.required[String]("t3_data")),
          OptionalRow.presentWhen("t4_id")(_.required[String]("t4_data")),
        )
        .map((parent, children1, children2, children3) => parent -> (children1 ++ children2 ++ children3))
        .runList()
        .failIfFailure

      res should be(List("parent1" -> List("child1_of_parent1", "child1_of_parent1", "child1_of_parent1")))
    }
  }
}
