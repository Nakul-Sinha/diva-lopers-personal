defmodule Scheduler.MixProject do
  use Mix.Project

  def project do
    [
      app: :scheduler,
      version: "0.1.0",
      elixir: "~> 1.14",
      start_permanent: Mix.env() == :prod,
      deps: deps()
    ]
  end

  def application do
    [
      extra_applications: [:logger]
    ]
  end

  defp deps do
    [
      # TODO(phase-2, external integration):
      # {:ex_aws, "~> 2.5"},
      # {:ex_aws_dynamo, "~> 4.0"},
      # {:jason, "~> 1.4"}
    ]
  end
end
