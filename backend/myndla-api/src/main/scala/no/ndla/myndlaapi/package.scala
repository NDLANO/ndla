/*
 * Part of NDLA myndla-api
 * Copyright (C) 2023 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla

import scalikejdbc.ParameterBinderFactory
import sttp.shared.Identity

import java.util.UUID

package object myndlaapi {
  type Eff[A] = Identity[A]

  implicit val uuidParameterFactory: ParameterBinderFactory[UUID] = ParameterBinderFactory[UUID] { v => (stmt, idx) =>
    stmt.setObject(idx, v)
  }
}
