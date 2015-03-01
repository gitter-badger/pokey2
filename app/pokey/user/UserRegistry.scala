package pokey.user

import akka.actor._

class UserRegistry extends Actor with ActorLogging {
  import pokey.user.UserRegistry._

  def withUsers(users: Map[String, ActorRef]): Receive = {
    case GetUserProxy(id) if users.contains(id) => sender ! users(id)

    case GetUserProxy(id) if !users.contains(id) =>
      val user = User(id, "Guest")
      val userProxy = context.actorOf(UserProxy.props(user), s"user-proxy-$id")
      context.watch(userProxy)
      log.info("new_user: {}", user)
      become(users + (id -> userProxy))
      sender ! userProxy

    case Terminated(userProxy) =>
      val deadUser = users.find {
        case (_, proxy) => proxy == userProxy
      }

      deadUser.map {
        case (id, proxy) =>
          log.info("user_pruned: {}", id)
          become(users - id)
      }.orElse {
        log.warning("unknown_user_terminated: {}", userProxy)
        None
      }
  }

  def receive = withUsers(Map.empty)

  private[this] def become(users: Map[String, ActorRef]) = context.become(withUsers(users))
}

object UserRegistry {
  /** Identifier for injecting with Scaldi. */
  val identifier = 'userRegistry

  case class GetUserProxy(id: String)

  def props = Props(new UserRegistry)
}
