import dispatchCommand from "dispatchCommand";
import { CommandType } from "commands";
import OrderItemType from "OrderItemType";
import CallbackId from "CallbackId";
import { getEventStore } from "EventStoreService";
import { respond } from "slackApi";

export async function handleActions(ctx) {
  const payload = JSON.parse(ctx.request.body.payload);

  if (payload.type === "interactive_message") {
    await dispatchCommand({
      type: CommandType.show_order_item_dialog,
      itemType: payload.actions[0].value,
      triggerId: payload.trigger_id,
    });
  } else if (payload.type === "dialog_submission") {
    if (payload.callback_id === CallbackId.add_order_item) {
      await dispatchCommand({
        type: CommandType.add_order_item,
        responseUrl: payload.response_url,
        userName: payload.user.id,
        item: {
          type: payload.state,
          filling: payload.submission.filling,
          sauce: payload.submission.sauce,
          drink: [
            OrderItemType.big_burrito,
            OrderItemType.double_quesadilla,
          ].includes(payload.state)
            ? payload.submission.drink
            : undefined,
          comments: payload.submission.comments,
        },
      });
    } else if (payload.callback_id === CallbackId.receive_payment) {
      const amount = Number(payload.submission.amount);
      await getEventStore().receivePayment(
        payload.user.id,
        payload.submission.sender,
        amount,
        payload.submission.type,
        payload.submission.comments,
      );
      await respond(
        payload.response_url,
        `:white_check_mark: ${amount} PLN received.`,
      );
    }
  } else {
    const error = `Unsupported type: ${payload.type}`;
    console.error(new Error(error));
    ctx.status = 400;
    ctx.body = error;
  }

  ctx.status = 204;
}
